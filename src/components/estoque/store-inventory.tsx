"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LotTable } from "./lot-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

interface Lot {
  id: string;
  store_id: string;
  origin_country: string;
  variety: string;
  process_method: string;
  current_stock_kg: number;
  purchase_date: string;
  supplier: string | null;
  label_image_url: string | null;
  farm_producer: string | null;
  notes: string | null;
  stores: { name: string } | null;
}

type Filter = "all" | string;

export function StoreInventory({
  stores,
  lots,
}: {
  stores: Store[];
  lots: Lot[];
}) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const [filter, setFilter] = useState<Filter>("all");

  const totalStock = lots.reduce(
    (sum, l) => sum + Number(l.current_stock_kg),
    0
  );

  const storeStats = stores.map((store) => {
    const storeLots = lots.filter((l) => l.store_id === store.id);
    const stock = storeLots.reduce(
      (sum, l) => sum + Number(l.current_stock_kg),
      0
    );
    return { ...store, lotCount: storeLots.length, stock };
  });

  const filteredLots =
    filter === "all" ? lots : lots.filter((l) => l.store_id === filter);

  return (
    <div className="space-y-4">
      {/* Store summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Total card */}
        <button
          onClick={() => setFilter("all")}
          className="text-left"
        >
          <Card
            className={`transition-shadow hover:shadow-md ${
              filter === "all"
                ? "ring-2 ring-[#FF0100] border-[#FF0100]"
                : ""
            }`}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FF0100]/10">
                <Package className="size-5 text-[#FF0100]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("totalStock")}
                </p>
                <p className="text-xl font-bold">
                  {totalStock.toFixed(1)} {tc("kg")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lots.length} {t("lots")}
                </p>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Per-store cards */}
        {storeStats.map((store) => (
          <button
            key={store.id}
            onClick={() => setFilter(store.id)}
            className="text-left"
          >
            <Card
              className={`transition-shadow hover:shadow-md ${
                filter === store.id
                  ? "ring-2 ring-[#FF0100] border-[#FF0100]"
                  : ""
              }`}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {store.name}
                  </p>
                  <p className="text-xl font-bold">
                    {store.stock.toFixed(1)} {tc("kg")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {store.lotCount} {t("lots")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Active filter badge */}
      {filter !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <MapPin className="size-3" />
            {storeStats.find((s) => s.id === filter)?.name}
          </Badge>
          <button
            onClick={() => setFilter("all")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("showAll")}
          </button>
        </div>
      )}

      {/* Table */}
      <LotTable
        lots={filteredLots}
        showStore={filter === "all"}
      />
    </div>
  );
}
