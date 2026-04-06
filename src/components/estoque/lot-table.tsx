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
import { getCoffeeName } from "@/lib/utils";

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
  notes: string | null;
  stores?: { name: string } | null;
}

interface LotTableProps {
  lots: Lot[];
  showStore?: boolean;
}

export function LotTable({ lots, showStore = false }: LotTableProps) {
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
          <TableHead>{t("coffeeName")}</TableHead>
          {showStore && <TableHead>{t("store")}</TableHead>}
          <TableHead>{t("origin")}</TableHead>
          <TableHead>{t("variety")}</TableHead>
          <TableHead>{t("process")}</TableHead>
          <TableHead>{t("currentStock")}</TableHead>
          <TableHead>{t("purchaseDate")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => {
          const coffeeName = getCoffeeName(lot);
          return (
            <TableRow key={lot.id} className="cursor-pointer">
              <TableCell>
                {lot.label_image_url ? (
                  <Image
                    src={lot.label_image_url}
                    alt={coffeeName}
                    width={40}
                    height={40}
                    className="size-10 rounded object-cover"
                  />
                ) : (
                  <div className="size-10 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/estoque/${lot.id}`}
                  className="hover:underline"
                >
                  <span className="font-bold text-[#FF0100]">
                    {coffeeName}
                  </span>
                </Link>
              </TableCell>
              {showStore && (
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {lot.stores?.name ?? "—"}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {lot.origin_country}
              </TableCell>
              <TableCell>{lot.variety}</TableCell>
              <TableCell>
                {t(
                  `processes.${lot.process_method}` as Parameters<typeof t>[0]
                )}
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
