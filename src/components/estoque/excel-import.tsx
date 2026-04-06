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
  Check,
  AlertTriangle,
  Pencil,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { PROCESS_METHODS } from "@/lib/constants";

/* ── types ── */

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
  _controlDate?: string;
}

interface ExcelImportProps {
  existingCoffees: ExistingCoffee[];
}

/* ── column map (tabular fallback) ── */

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
  return COLUMN_MAP[header.toLowerCase().trim()];
}

function parseDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date.y < 2000) return new Date().toISOString().split("T")[0];
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  if (typeof value === "string" && value.trim()) {
    // Handle m/d/yy and dd/mm/yyyy
    const parts = value.trim().split(/[/\-\.]/);
    if (parts.length === 3) {
      let [a, b, c] = parts.map(Number);
      if (c < 100) c += 2000;
      if (c < 2000) return new Date().toISOString().split("T")[0];
      // US format: m/d/yy
      if (a <= 12) {
        return `${c}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
      }
      // EU format: dd/mm/yyyy
      return `${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    }
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }
  return new Date().toISOString().split("T")[0];
}

/* ── fuzzy matching ── */

/** Normalize text: remove accents, dots, extra spaces, lowercase */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\./g, " ")            // dots → spaces
    .replace(/\s+/g, " ")           // collapse spaces
    .trim()
    .toLowerCase();
}

/** Known non-city words that appear in parentheses but are NOT Swiss cities */
const NON_CITY = [
  "finca", "paraiso", "paraíso", "abu", "coffee", "forest", "esperanza",
  "espereanza", "campo", "hermoso", "sirena", "roast", "rebels", "label",
  "sea", "island", "robusta",
];

function isLikelyCity(text: string): boolean {
  const lower = text.toLowerCase();
  return !NON_CITY.some((w) => lower.includes(w));
}

/** Extract Swiss city from catalog name: "6300 Zug" → "zug", "9001 St. Gallen" → "st gallen" */
function extractCity(catalogName: string): string {
  // Remove postal code prefix, then normalize (dots→spaces, accents, lowercase)
  return norm(catalogName.replace(/^\d{4}\s+/, ""));
}

/** Extract city from Excel name like "Gesha (Finca el Paraiso - Zug)" → "zug" */
function extractCityFromExcel(name: string): string | null {
  // Try "... - CityName)" pattern first (most common in C+ sheets)
  const dashMatch = name.match(/[-–]\s*([A-Za-zÀ-ÿ.\s]+?)\s*\)?$/);
  if (dashMatch) {
    const candidate = dashMatch[1].trim();
    if (isLikelyCity(candidate)) return norm(candidate);
  }

  // Try "(CityName)" at end — only if it looks like a city
  const parenMatch = name.match(/\(([A-Za-zÀ-ÿ.\s]+?)\)\s*$/);
  if (parenMatch) {
    const candidate = parenMatch[1].trim();
    if (isLikelyCity(candidate)) return norm(candidate);
  }

  // Try bare "Name - City" without parens
  const bareMatch = name.match(/[-–]\s*([A-Za-zÀ-ÿ.\s]+?)$/);
  if (bareMatch) {
    const candidate = bareMatch[1].trim();
    if (isLikelyCity(candidate)) return norm(candidate);
  }

  return null;
}

/**
 * Blend ingredient keywords — coffees containing these that have NO city
 * are likely raw ingredients for house blends (Interlaken / Montreux)
 */
const BLEND_KEYWORDS = [
  "santos", "tarrazu", "parchement", "robusta", "bio natural",
  "bio and fair", "delicia",
];

function isBlendIngredient(name: string): boolean {
  const lower = name.toLowerCase();
  return BLEND_KEYWORDS.some((kw) => lower.includes(kw));
}

function findMatch(
  name: string,
  existingCoffees: ExistingCoffee[]
): ExistingCoffee | undefined {
  const lower = name.toLowerCase().trim();
  if (!lower) return undefined;

  // 1. City-based matching (primary strategy for C+ coffees)
  const excelCity = extractCityFromExcel(name);
  if (excelCity) {
    // Prefer exact city match first
    for (const coffee of existingCoffees) {
      const catalogCity = extractCity(coffee.name);
      if (catalogCity === excelCity) return coffee;
    }
    // Then try containment (only for longer city names to avoid "st" collisions)
    if (excelCity.length > 3) {
      for (const coffee of existingCoffees) {
        const catalogCity = extractCity(coffee.name);
        if (!catalogCity || catalogCity.length < 4) continue;
        if (catalogCity.includes(excelCity) || excelCity.includes(catalogCity))
          return coffee;
      }
    }
  }

  // 2. Check if any catalog city appears anywhere in the imported name
  //    Only match if the city name is long enough to be unambiguous
  const normalizedName = norm(name);
  for (const coffee of existingCoffees) {
    const city = extractCity(coffee.name);
    if (city.length > 3 && normalizedName.includes(city)) return coffee;
  }

  // 3. Skip further matching for blend ingredients — they don't map to a city
  if (isBlendIngredient(name)) return undefined;

  // 4. Exact match on full catalog name
  const exact = existingCoffees.find((c) => norm(c.name) === normalizedName);
  if (exact) return exact;

  return undefined;
}

/* ── block format parser (C+ inventory sheets) ── */

function isBlockFormat(rows: unknown[][]): boolean {
  const text = rows
    .flat()
    .filter(Boolean)
    .map((v) => String(v).toLowerCase())
    .join(" ");
  return (
    text.includes("green beans remaining") ||
    text.includes("roasting date") ||
    text.includes("quantity roasted")
  );
}

interface BlockCoffee {
  name: string;
  remainingGrams: number;
  controlDate: string;
}

function parseBlocks(rows: unknown[][]): BlockCoffee[] {
  const coffees: BlockCoffee[] = [];
  let i = 0;

  while (i < rows.length) {
    const row = rows[i] ?? [];
    // Coffee name row: column B has a string, not a header keyword
    const colB = row[1] != null ? String(row[1]).trim() : "";
    const colBLower = colB.toLowerCase();

    if (
      colB &&
      !colBLower.includes("roasting date") &&
      !colBLower.includes("quantity roasted") &&
      !colBLower.includes("green beans remaining") &&
      colB.length > 3
    ) {
      // Potential coffee name — look ahead for "Green Beans Remaining"
      let remainingGrams = 0;
      let controlDate = "";
      let found = false;

      for (let j = i + 1; j < Math.min(i + 10, rows.length); j++) {
        const checkRow = rows[j] ?? [];
        const checkB = checkRow[1] != null ? String(checkRow[1]).trim() : "";
        if (checkB.toLowerCase().includes("green beans remaining")) {
          // Next row should have [date, grams]
          const dataRow = rows[j + 1] ?? [];
          if (dataRow.length > 0) {
            // Some sheets have date in col A, grams in col B
            // Others have them shifted
            const val0 = dataRow[0];
            const val1 = dataRow[1];

            if (val1 != null && !isNaN(Number(val1))) {
              remainingGrams = Number(val1);
              controlDate = val0 != null ? parseDate(val0) : "";
            } else if (val0 != null && !isNaN(Number(val0))) {
              remainingGrams = Number(val0);
            }
          }
          found = true;
          break;
        }
      }

      if (found) {
        coffees.push({
          name: colB,
          remainingGrams,
          controlDate,
        });
      }
    }

    i++;
  }

  return coffees;
}

/* ── tabular parser ── */

function parseTabular(
  jsonData: Record<string, unknown>[]
): ParsedLot[] {
  const lots: ParsedLot[] = [];
  for (const row of jsonData) {
    const mapped: Partial<ParsedLot> = {};
    for (const [key, value] of Object.entries(row)) {
      const field = normalizeHeader(key);
      if (!field) continue;
      if (field === "purchase_date") mapped[field] = parseDate(value);
      else if (field === "quantity_kg" || field === "price_per_kg")
        mapped[field] = Number(value) || 0;
      else mapped[field] = String(value ?? "");
    }
    if (mapped.origin_country && mapped.variety && mapped.process_method) {
      lots.push({
        origin_country: mapped.origin_country,
        variety: mapped.variety,
        process_method: mapped.process_method,
        quantity_kg: mapped.quantity_kg ?? 0,
        purchase_date:
          mapped.purchase_date ?? new Date().toISOString().split("T")[0],
        supplier: mapped.supplier,
        farm_producer: mapped.farm_producer,
        price_per_kg: mapped.price_per_kg,
        notes: mapped.notes,
      });
    }
  }
  return lots;
}

/* ── component ── */

export function ExcelImport({ existingCoffees }: ExcelImportProps) {
  const t = useTranslations("inventory");
  const te = useTranslations("inventory.excelImport");
  const tc = useTranslations("common");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ImportRow | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
    });

    let importRows: ImportRow[] = [];

    if (isBlockFormat(rawRows as unknown[][])) {
      // ── C+ inventory block format ──
      const blocks = parseBlocks(rawRows as unknown[][]);
      const today = new Date().toISOString().split("T")[0];

      for (const block of blocks) {
        const match = findMatch(block.name, existingCoffees);
        const quantityKg = Math.round((block.remainingGrams / 1000) * 100) / 100;

        if (match) {
          importRows.push({
            origin_country: match.origin_country,
            variety: match.variety,
            process_method: match.process_method,
            quantity_kg: quantityKg,
            purchase_date: "",
            notes: block.name,
            _status: "matched",
            _matchedName: match.name,
            _controlDate: block.controlDate || today,
          });
        } else {
          importRows.push({
            origin_country: "",
            variety: "",
            process_method: "other",
            quantity_kg: quantityKg,
            purchase_date: "",
            notes: block.name,
            _status: "unmatched",
            _controlDate: block.controlDate || today,
          });
        }
      }
    } else {
      // ── tabular format ──
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const tabularLots = parseTabular(jsonData);

      for (const lot of tabularLots) {
        const coffeeName =
          lot.notes?.trim() || lot.origin_country;
        const match = findMatch(coffeeName, existingCoffees);

        if (match) {
          importRows.push({
            ...lot,
            origin_country: match.origin_country,
            variety: match.variety,
            process_method: match.process_method,
            _status: "matched",
            _matchedName: match.name,
          });
        } else {
          importRows.push({
            ...lot,
            _status: "unmatched",
          });
        }
      }
    }

    setRows(importRows);
  }

  function openEdit(idx: number) {
    setEditForm({ ...rows[idx] });
    setEditingIdx(idx);
  }

  function saveEdit() {
    if (editingIdx === null || !editForm) return;
    setRows((prev) => {
      const updated = [...prev];
      updated[editingIdx] = {
        ...editForm,
        _status: "matched",
        _matchedName:
          editForm.notes?.trim() || editForm.origin_country,
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
      ({ _status, _matchedName, _controlDate, ...lot }) => ({
        ...lot,
        // Use control date as purchase date if no purchase date provided
        purchase_date:
          lot.purchase_date || _controlDate || new Date().toISOString().split("T")[0],
      })
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
  const totalKg = rows.reduce((sum, r) => sum + r.quantity_kg, 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{te("description")}</p>

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
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm">
              {rows.length} {t("lots")}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {totalKg.toFixed(1)} {tc("kg")} total
            </Badge>
            {unmatchedCount > 0 && (
              <Badge
                variant="outline"
                className="border-amber-300 text-sm text-amber-700"
              >
                <AlertTriangle className="mr-1 size-3" />
                {te("unmatchedWarning", { count: unmatchedCount })}
              </Badge>
            )}
          </div>

          {/* Warning */}
          {unmatchedCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <p className="text-amber-700 dark:text-amber-300">
                {te("unmatchedHint")}
              </p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{t("coffeeName")}</TableHead>
                <TableHead>{t("origin")}</TableHead>
                <TableHead>{t("variety")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{te("controlDate")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                const name =
                  row.notes?.trim() || row.origin_country || "—";
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{name}</span>
                        {row._status === "matched" && row._matchedName && (
                          <Badge variant="secondary" className="text-xs">
                            {row._matchedName}
                          </Badge>
                        )}
                        {row._status === "unmatched" && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-xs text-amber-700"
                          >
                            {te("notFound")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.origin_country || "—"}
                    </TableCell>
                    <TableCell>{row.variety || "—"}</TableCell>
                    <TableCell className="font-medium">
                      {row.quantity_kg} {tc("kg")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row._controlDate || "—"}
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
                          <Trash2 className="size-3" />
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
            {unmatchedCount > 0 && (
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
              {/* Catalog suggestions */}
              {existingCoffees.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {te("suggestions")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto">
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

              {/* Dates section */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-control-date">
                    {te("controlDate")}
                  </Label>
                  <Input
                    id="edit-control-date"
                    type="date"
                    value={editForm._controlDate ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, _controlDate: e.target.value }
                          : prev
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {te("controlDateHint")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-purchase-date">
                    {t("purchaseDate")}
                  </Label>
                  <Input
                    id="edit-purchase-date"
                    type="date"
                    value={editForm.purchase_date ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, purchase_date: e.target.value }
                          : prev
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {te("purchaseDateHint")}
                  </p>
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
