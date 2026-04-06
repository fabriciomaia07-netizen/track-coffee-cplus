"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { importGreenLotsFromExcel } from "@/lib/actions/estoque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Check,
  AlertTriangle,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { PROCESS_METHODS } from "@/lib/constants";

interface ParsedLot {
  origin_country: string;
  variety: string;
  process_method: string;
  quantity_kg: number;
  purchase_date: string;
  supplier?: string;
  farm_producer?: string;
  price_per_kg?: number;
  notes?: string;
}

interface ExistingCoffee {
  id: string;
  name: string;
  origin_country: string;
  variety: string;
  process_method: string;
}

interface ImportRow extends ParsedLot {
  _status: "matched" | "unmatched";
  _matchedName?: string;
}

interface ExcelImportProps {
  existingCoffees: ExistingCoffee[];
}

const COLUMN_MAP: Record<string, keyof ParsedLot> = {
  origin: "origin_country",
  origin_country: "origin_country",
  país: "origin_country",
  pais: "origin_country",
  country: "origin_country",
  variety: "variety",
  variedade: "variety",
  variété: "variety",
  process: "process_method",
  process_method: "process_method",
  processo: "process_method",
  procédé: "process_method",
  quantity: "quantity_kg",
  quantity_kg: "quantity_kg",
  quantidade: "quantity_kg",
  quantité: "quantity_kg",
  kg: "quantity_kg",
  stock: "quantity_kg",
  "purchase date": "purchase_date",
  purchase_date: "purchase_date",
  "data compra": "purchase_date",
  data_compra: "purchase_date",
  date: "purchase_date",
  supplier: "supplier",
  fornecedor: "supplier",
  fournisseur: "supplier",
  farm: "farm_producer",
  farm_producer: "farm_producer",
  fazenda: "farm_producer",
  produtor: "farm_producer",
  ferme: "farm_producer",
  producteur: "farm_producer",
  price: "price_per_kg",
  price_per_kg: "price_per_kg",
  preço: "price_per_kg",
  preco: "price_per_kg",
  prix: "price_per_kg",
  notes: "notes",
  notas: "notes",
  observações: "notes",
  observacoes: "notes",
  name: "notes",
  coffee: "notes",
  café: "notes",
  cafe: "notes",
  nom: "notes",
};

function normalizeHeader(header: string): keyof ParsedLot | undefined {
  const lower = header.toLowerCase().trim();
  return COLUMN_MAP[lower];
}

function parseDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return value.trim();
  }
  return new Date().toISOString().split("T")[0];
}

/** Fuzzy match: checks if the name contains parts of any existing coffee name */
function findMatch(
  name: string,
  existingCoffees: ExistingCoffee[]
): ExistingCoffee | undefined {
  const lower = name.toLowerCase().trim();
  if (!lower) return undefined;

  // Exact match first
  const exact = existingCoffees.find(
    (c) => c.name.toLowerCase() === lower
  );
  if (exact) return exact;

  // Check if existing name is contained in imported name or vice versa
  for (const coffee of existingCoffees) {
    const cLower = coffee.name.toLowerCase();
    if (lower.includes(cLower) || cLower.includes(lower)) {
      return coffee;
    }
  }

  // Word overlap: if >50% of words match
  const words = lower.split(/\s+/);
  for (const coffee of existingCoffees) {
    const cWords = coffee.name.toLowerCase().split(/\s+/);
    const overlap = words.filter((w) =>
      cWords.some((cw) => cw.includes(w) || w.includes(cw))
    );
    if (overlap.length >= Math.ceil(Math.min(words.length, cWords.length) / 2)) {
      return coffee;
    }
  }

  return undefined;
}

export function ExcelImport({ existingCoffees }: ExcelImportProps) {
  const t = useTranslations("inventory");
  const te = useTranslations("inventory.excelImport");
  const tc = useTranslations("common");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedLot | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const importRows: ImportRow[] = [];

    for (const row of jsonData) {
      const mapped: Partial<ParsedLot> = {};

      for (const [key, value] of Object.entries(row)) {
        const field = normalizeHeader(key);
        if (!field) continue;

        if (field === "purchase_date") {
          mapped[field] = parseDate(value);
        } else if (field === "quantity_kg" || field === "price_per_kg") {
          mapped[field] = Number(value) || 0;
        } else {
          mapped[field] = String(value ?? "");
        }
      }

      // Build the coffee name from notes or origin
      const coffeeName =
        mapped.notes?.split(".")[0]?.trim() ||
        mapped.origin_country ||
        "";

      // Try to match against existing coffees
      const match = findMatch(coffeeName, existingCoffees);

      if (match) {
        // Auto-fill from existing coffee data
        importRows.push({
          origin_country: match.origin_country,
          variety: match.variety,
          process_method: match.process_method,
          quantity_kg: mapped.quantity_kg ?? 0,
          purchase_date:
            mapped.purchase_date ?? new Date().toISOString().split("T")[0],
          supplier: mapped.supplier,
          farm_producer: mapped.farm_producer,
          price_per_kg: mapped.price_per_kg,
          notes: mapped.notes,
          _status: "matched",
          _matchedName: match.name,
        });
      } else {
        importRows.push({
          origin_country: mapped.origin_country ?? "",
          variety: mapped.variety ?? "",
          process_method: mapped.process_method ?? "other",
          quantity_kg: mapped.quantity_kg ?? 0,
          purchase_date:
            mapped.purchase_date ?? new Date().toISOString().split("T")[0],
          supplier: mapped.supplier,
          farm_producer: mapped.farm_producer,
          price_per_kg: mapped.price_per_kg,
          notes: mapped.notes,
          _status: "unmatched",
        });
      }
    }

    setRows(importRows);
  }

  function openEdit(idx: number) {
    const row = rows[idx];
    setEditForm({
      origin_country: row.origin_country,
      variety: row.variety,
      process_method: row.process_method,
      quantity_kg: row.quantity_kg,
      purchase_date: row.purchase_date,
      supplier: row.supplier,
      farm_producer: row.farm_producer,
      price_per_kg: row.price_per_kg,
      notes: row.notes,
    });
    setEditingIdx(idx);
  }

  function saveEdit() {
    if (editingIdx === null || !editForm) return;

    setRows((prev) => {
      const updated = [...prev];
      updated[editingIdx] = {
        ...editForm,
        _status: "matched",
        _matchedName: editForm.notes?.split(".")[0]?.trim() || editForm.origin_country,
      };
      return updated;
    });
    setEditingIdx(null);
    setEditForm(null);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleImport() {
    if (rows.length === 0) return;

    const lotsToImport = rows.map(
      ({ _status, _matchedName, ...lot }) => lot
    );

    setImporting(true);
    const result = await importGreenLotsFromExcel(lotsToImport);
    setImporting(false);

    if (result.error) {
      toast.error(te("error"));
      return;
    }

    toast.success(te("success", { count: result.count ?? 0 }));
    router.push("/dashboard/estoque");
  }

  const unmatchedCount = rows.filter((r) => r._status === "unmatched").length;
  const hasUnmatched = unmatchedCount > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{te("description")}</p>
      </div>

      <div className="space-y-2">
        <Label>{te("selectFile")}</Label>
        <Input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="max-w-sm"
        />
      </div>

      {rows.length > 0 && (
        <>
          {/* Warning banner for unmatched rows */}
          {hasUnmatched && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {te("unmatchedWarning", { count: unmatchedCount })}
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  {te("unmatchedHint")}
                </p>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{t("coffeeName")}</TableHead>
                <TableHead>{t("origin")}</TableHead>
                <TableHead>{t("variety")}</TableHead>
                <TableHead>{t("process")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                const name =
                  row.notes?.split(".")[0]?.trim() || row.origin_country;
                return (
                  <TableRow
                    key={idx}
                    className={
                      row._status === "unmatched"
                        ? "bg-amber-50/50 dark:bg-amber-950/20"
                        : ""
                    }
                  >
                    <TableCell>
                      {row._status === "matched" ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{name}</span>
                        {row._status === "matched" && row._matchedName && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-xs"
                          >
                            {row._matchedName}
                          </Badge>
                        )}
                        {row._status === "unmatched" && (
                          <Badge
                            variant="outline"
                            className="ml-2 border-amber-300 text-xs text-amber-700"
                          >
                            {te("notFound")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{row.origin_country || "—"}</TableCell>
                    <TableCell>{row.variety || "—"}</TableCell>
                    <TableCell>
                      {row.process_method
                        ? t(
                            `processes.${row.process_method}` as Parameters<
                              typeof t
                            >[0]
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {row.quantity_kg} {tc("kg")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => openEdit(idx)}
                          title={tc("edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => removeRow(idx)}
                          title={tc("delete")}
                        >
                          ×
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center gap-3">
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {te("importing")}
                </>
              ) : (
                <>
                  <Check data-icon="inline-start" />
                  {tc("confirm")} ({rows.length})
                </>
              )}
            </Button>
            {hasUnmatched && (
              <p className="text-xs text-amber-600">
                {te("unmatchedImportNote")}
              </p>
            )}
          </div>
        </>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editingIdx !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingIdx(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{te("editRow")}</DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4">
              {/* Suggestion badges from existing coffees */}
              {existingCoffees.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {te("suggestions")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {existingCoffees.map((coffee) => (
                      <button
                        key={coffee.id}
                        type="button"
                        onClick={() =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  origin_country: coffee.origin_country,
                                  variety: coffee.variety,
                                  process_method: coffee.process_method,
                                  notes: coffee.name,
                                }
                              : prev
                          )
                        }
                        className="rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-muted"
                      >
                        {coffee.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-notes">{t("coffeeName")}</Label>
                  <Input
                    id="edit-notes"
                    value={editForm.notes ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, notes: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-origin">{t("origin")}</Label>
                  <Input
                    id="edit-origin"
                    value={editForm.origin_country}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, origin_country: e.target.value }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-variety">{t("variety")}</Label>
                  <Input
                    id="edit-variety"
                    value={editForm.variety}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, variety: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-process">{t("process")}</Label>
                  <select
                    id="edit-process"
                    value={editForm.process_method}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, process_method: e.target.value }
                          : prev
                      )
                    }
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {PROCESS_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {t(
                          `processes.${method}` as Parameters<typeof t>[0]
                        )}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-qty">{t("quantity")}</Label>
                  <Input
                    id="edit-qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.quantity_kg}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              quantity_kg: Number(e.target.value) || 0,
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-farm">{t("farm")}</Label>
                  <Input
                    id="edit-farm"
                    value={editForm.farm_producer ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, farm_producer: e.target.value }
                          : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingIdx(null);
                setEditForm(null);
              }}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={saveEdit}>{tc("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
