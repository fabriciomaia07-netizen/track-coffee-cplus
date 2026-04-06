import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { LotForm } from "@/components/estoque/lot-form";
import { DeleteLotButton } from "@/components/estoque/delete-lot-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Tables } from "@/types/database";
import { SpiderChart } from "@/components/perfis/spider-chart";
import { getCoffeeName } from "@/lib/utils";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: lot } = (await supabase
    .from("green_coffee_lots")
    .select("*")
    .eq("id", id)
    .single()) as { data: Tables<"green_coffee_lots"> | null };

  if (!lot) {
    notFound();
  }

  // Fetch the flavor profile for this coffee
  const { data: flavorProfile } = await supabase
    .from("flavor_profiles")
    .select("*")
    .eq("green_coffee_lot_id", id)
    .maybeSingle();

  const coffeeName = getCoffeeName(lot);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/estoque">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#FF0100]">{coffeeName}</h1>
        </div>
        <DeleteLotButton lotId={lot.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: image + flavor profile */}
        <div className="space-y-6">
          {lot.label_image_url && (
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("inventory.labelImage")}
              </p>
              <Image
                src={lot.label_image_url}
                alt={coffeeName}
                width={400}
                height={300}
                className="rounded-md object-contain"
              />
            </div>
          )}

          {/* Flavor Profile Card */}
          {flavorProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("profiles.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <SpiderChart
                  data={{
                    acidity: flavorProfile.acidity ?? 0,
                    body: flavorProfile.body ?? 0,
                    sweetness: flavorProfile.sweetness ?? 0,
                    bitterness: flavorProfile.bitterness ?? 0,
                    aftertaste: flavorProfile.aftertaste ?? 0,
                  }}
                />

                {/* Numeric values */}
                <div className="grid grid-cols-5 gap-2 w-full text-center text-xs">
                  {[
                    { label: t("profiles.sweetness"), value: flavorProfile.sweetness },
                    { label: t("profiles.body"), value: flavorProfile.body },
                    { label: t("profiles.acidity"), value: flavorProfile.acidity },
                    { label: t("profiles.bitterness"), value: flavorProfile.bitterness },
                    { label: t("profiles.aftertaste"), value: flavorProfile.aftertaste },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-sm">{item.value ?? 0}/5</span>
                    </div>
                  ))}
                </div>

                {/* Tasting notes */}
                {flavorProfile.tasting_notes && (
                  <div className="w-full rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t("profiles.tastingNotes")}
                    </p>
                    <p className="text-sm">{flavorProfile.tasting_notes}</p>
                  </div>
                )}

                {flavorProfile.sca_score && (
                  <div className="text-sm text-muted-foreground">
                    {t("profiles.scaScore")}: <span className="font-semibold">{flavorProfile.sca_score}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: edit form */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">{t("inventory.editLot")}</h2>
          <LotForm lot={lot} />
        </div>
      </div>
    </div>
  );
}
