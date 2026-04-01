"use client";

import { useTranslations } from "next-intl";
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
import { AlertTriangle, Coffee } from "lucide-react";

export interface RoastedItem {
  id: string;
  quantity_kg: number;
  current_stock_kg: number;
  roast_date: string;
  roast_sessions: {
    id: string;
    roast_level: "light" | "medium" | "medium-dark" | "dark";
    roast_profile_notes: string | null;
    green_coffee_lots: {
      origin_country: string;
      variety: string;
      farm_producer: string | null;
      label_image_url: string | null;
    };
  };
}

const levelColors: Record<string, string> = {
  light: "bg-amber-100 text-amber-800",
  medium: "bg-amber-200 text-amber-900",
  "medium-dark": "bg-amber-700 text-amber-50",
  dark: "bg-amber-900 text-amber-50",
};

export function RoastedTable({ items }: { items: RoastedItem[] }) {
  const t = useTranslations("roastedCoffee");
  const tc = useTranslations("common");

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Coffee className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">{t("noStock")}</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          {t("noStockDescription")}
        </p>
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
          <TableHead>{t("roastLevel")}</TableHead>
          <TableHead>{t("currentStock")}</TableHead>
          <TableHead>{t("roastDate")}</TableHead>
          <TableHead>{t("notes")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const lot = item.roast_sessions?.green_coffee_lots;
          const session = item.roast_sessions;
          return (
            <TableRow key={item.id}>
              <TableCell>
                {lot?.label_image_url ? (
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
              <TableCell className="font-medium">
                {lot?.origin_country ?? "—"}
                {lot?.farm_producer && (
                  <span className="block text-xs text-muted-foreground">
                    {lot.farm_producer}
                  </span>
                )}
              </TableCell>
              <TableCell>{lot?.variety ?? "—"}</TableCell>
              <TableCell>
                <Badge
                  className={
                    levelColors[session?.roast_level ?? "medium"] ?? ""
                  }
                >
                  {t(
                    `levels.${session?.roast_level}` as Parameters<typeof t>[0]
                  )}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  {item.current_stock_kg} {tc("kg")}
                  {item.current_stock_kg < 1 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="size-3" />
                    </Badge>
                  )}
                </span>
              </TableCell>
              <TableCell>
                {new Date(item.roast_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {session?.roast_profile_notes ?? "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
