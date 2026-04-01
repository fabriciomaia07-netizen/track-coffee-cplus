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
import { toast } from "sonner";
import { Loader2, Upload, Check } from "lucide-react";

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

const COLUMN_MAP: Record<string, keyof ParsedLot> = {
  origin: "origin_country",
  origin_country: "origin_country",
  país: "origin_country",
  pais: "origin_country",
  variety: "variety",
  variedade: "variety",
  process: "process_method",
  process_method: "process_method",
  processo: "process_method",
  quantity: "quantity_kg",
  quantity_kg: "quantity_kg",
  quantidade: "quantity_kg",
  "purchase date": "purchase_date",
  purchase_date: "purchase_date",
  "data compra": "purchase_date",
  data_compra: "purchase_date",
  supplier: "supplier",
  fornecedor: "supplier",
  farm: "farm_producer",
  farm_producer: "farm_producer",
  fazenda: "farm_producer",
  produtor: "farm_producer",
  price: "price_per_kg",
  price_per_kg: "price_per_kg",
  preço: "price_per_kg",
  preco: "price_per_kg",
  notes: "notes",
  notas: "notes",
  observações: "notes",
  observacoes: "notes",
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
    // Excel serial date
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

export function ExcelImport() {
  const t = useTranslations("inventory");
  const te = useTranslations("inventory.excelImport");
  const tc = useTranslations("common");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsedLots, setParsedLots] = useState<ParsedLot[]>([]);
  const [importing, setImporting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const lots: ParsedLot[] = [];

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

      if (mapped.origin_country && mapped.variety && mapped.process_method) {
        lots.push({
          origin_country: mapped.origin_country,
          variety: mapped.variety,
          process_method: mapped.process_method,
          quantity_kg: mapped.quantity_kg ?? 0,
          purchase_date: mapped.purchase_date ?? new Date().toISOString().split("T")[0],
          supplier: mapped.supplier,
          farm_producer: mapped.farm_producer,
          price_per_kg: mapped.price_per_kg,
          notes: mapped.notes,
        });
      }
    }

    setParsedLots(lots);
  }

  async function handleImport() {
    if (parsedLots.length === 0) return;

    setImporting(true);
    const result = await importGreenLotsFromExcel(parsedLots);
    setImporting(false);

    if (result.error) {
      toast.error(te("error"));
      return;
    }

    toast.success(te("success", { count: result.count ?? 0 }));
    router.push("/dashboard/estoque");
  }

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

      {parsedLots.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("origin")}</TableHead>
                <TableHead>{t("variety")}</TableHead>
                <TableHead>{t("process")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("purchaseDate")}</TableHead>
                <TableHead>{t("supplier")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedLots.map((lot, idx) => (
                <TableRow key={idx}>
                  <TableCell>{lot.origin_country}</TableCell>
                  <TableCell>{lot.variety}</TableCell>
                  <TableCell>{lot.process_method}</TableCell>
                  <TableCell>
                    {lot.quantity_kg} {tc("kg")}
                  </TableCell>
                  <TableCell>{lot.purchase_date}</TableCell>
                  <TableCell>{lot.supplier ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button onClick={handleImport} disabled={importing}>
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {te("importing")}
              </>
            ) : (
              <>
                <Check data-icon="inline-start" />
                {tc("confirm")} ({parsedLots.length})
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
