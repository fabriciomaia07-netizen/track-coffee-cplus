"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Leaf, Droplets, Mountain } from "lucide-react";
import { processColors } from "@/lib/constants";

interface Lot {
  id: string;
  origin_country: string;
  variety: string;
  process_method: string;
  current_stock_kg: number;
  farm_producer: string | null;
  notes: string | null;
  label_image_url: string | null;
}

export function CatalogGrid({ lots }: { lots: Lot[] }) {
  const t = useTranslations("catalog");

  const sorted = [...lots].sort((a, b) => {
    const nameA = a.notes?.split(".")[0] || a.origin_country;
    const nameB = b.notes?.split(".")[0] || b.origin_country;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((lot) => {
        const coffeeName = lot.notes?.split(".")[0] || lot.origin_country;
        const description = lot.notes?.split(".").slice(1).join(".").trim() || "";

        return (
          <Link
            key={lot.id}
            href={`/dashboard/catalogo/${lot.id}`}
            className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
          >
            {lot.label_image_url ? (
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={lot.label_image_url}
                  alt={coffeeName}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
            ) : (
              <div className="aspect-square bg-muted" />
            )}

            <div className="space-y-3 p-4">
              <h3 className="text-lg font-bold leading-tight text-[#FF0100]">
                {coffeeName}
              </h3>

              <div className="flex flex-wrap gap-1.5">
                <Badge className={processColors[lot.process_method] || processColors.other}>
                  <Droplets className="mr-1 size-3" />
                  {t(`processes.${lot.process_method}` as Parameters<typeof t>[0])}
                </Badge>
                {lot.current_stock_kg > 0 && (
                  <Badge variant="outline">
                    {lot.current_stock_kg} kg
                  </Badge>
                )}
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>{lot.origin_country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Leaf className="size-3.5 shrink-0" />
                  <span>{lot.variety}</span>
                </div>
                {lot.farm_producer && (
                  <div className="flex items-center gap-1.5">
                    <Mountain className="size-3.5 shrink-0" />
                    <span>{lot.farm_producer}</span>
                  </div>
                )}
              </div>

              {description && (
                <p className="line-clamp-3 text-xs text-muted-foreground/70">
                  {description}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
