"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Lot {
  id: string;
  origin_country: string;
  variety: string;
  process_method: string;
  current_stock_kg: number;
  purchase_date: string;
  supplier: string | null;
  label_image_url: string | null;
  farm_producer: string | null;
}

export function LotTable({ lots }: { lots: Lot[] }) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");

  if (lots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{tc("noResults")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12" />
          <TableHead>{t("origin")}</TableHead>
          <TableHead>{t("variety")}</TableHead>
          <TableHead>{t("process")}</TableHead>
          <TableHead>{t("currentStock")}</TableHead>
          <TableHead>{t("purchaseDate")}</TableHead>
          <TableHead>{t("supplier")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.id} className="cursor-pointer">
            <TableCell>
              {lot.label_image_url ? (
                <Image
                  src={lot.label_image_url}
                  alt="Label"
                  width={32}
                  height={32}
                  className="size-8 rounded object-cover"
                />
              ) : (
                <div className="size-8 rounded bg-muted" />
              )}
            </TableCell>
            <TableCell>
              <Link
                href={`/dashboard/estoque/${lot.id}`}
                className="font-medium hover:underline"
              >
                {lot.origin_country}
              </Link>
            </TableCell>
            <TableCell>{lot.variety}</TableCell>
            <TableCell>
              {t(`processes.${lot.process_method}` as Parameters<typeof t>[0])}
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-2">
                {lot.current_stock_kg} {tc("kg")}
                {lot.current_stock_kg < 5 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="size-3" />
                    {t("lowStockWarning")}
                  </Badge>
                )}
              </span>
            </TableCell>
            <TableCell>
              {new Date(lot.purchase_date).toLocaleDateString()}
            </TableCell>
            <TableCell>{lot.supplier ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
