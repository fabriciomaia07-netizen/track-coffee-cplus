import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { SpiderChart } from "@/components/perfis/spider-chart";
import Image from "next/image";
import { getCoffeeName } from "@/lib/utils";

export default async function FlavorProfilesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  // Fetch catalog profiles (linked to green coffee lots)
  const { data: catalogProfiles } = await supabase
    .from("flavor_profiles")
    .select(
      "*, green_coffee_lots!flavor_profiles_green_coffee_lot_id_fkey(id, origin_country, variety, farm_producer, notes, label_image_url)"
    )
    .not("green_coffee_lot_id", "is", null)
    .order("created_at", { ascending: false });

  // Fetch roast session profiles
  const { data: roastProfiles } = await supabase
    .from("flavor_profiles")
    .select(
      "*, roast_sessions(id, roast_date, roast_level, green_coffee_lots(id, origin_country, variety, notes, label_image_url))"
    )
    .not("roast_session_id", "is", null)
    .order("created_at", { ascending: false });

  const hasCatalog = catalogProfiles && catalogProfiles.length > 0;
  const hasRoast = roastProfiles && roastProfiles.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("profiles.title")}</h1>
        <Link href="/dashboard/perfis/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("profiles.newProfile")}
          </Button>
        </Link>
      </div>

      {/* Catalog Profiles — one per coffee */}
      {hasCatalog && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(catalogProfiles as any[]).map((profile) => {
            const lot = profile.green_coffee_lots;
            const coffeeName = getCoffeeName(lot);
            const lotId = lot?.id;
            const imageUrl = lot?.label_image_url;

            return (
              <Link
                key={profile.id}
                href={lotId ? `/dashboard/estoque/${lotId}` : "#"}
                className="block transition-transform hover:scale-[1.02]"
              >
                <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary/20">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={coffeeName}
                        width={40}
                        height={40}
                        className="size-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold text-[#FF0100] truncate">
                        {coffeeName}
                      </CardTitle>
                      {lot?.farm_producer && (
                        <CardDescription className="truncate text-xs">
                          {lot.farm_producer}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-3 pt-0">
                    <SpiderChart
                      data={{
                        acidity: profile.acidity ?? 0,
                        body: profile.body ?? 0,
                        sweetness: profile.sweetness ?? 0,
                        bitterness: profile.bitterness ?? 0,
                        aftertaste: profile.aftertaste ?? 0,
                      }}
                    />
                    {profile.sca_score && (
                      <Badge variant="secondary">
                        SCA: {profile.sca_score}
                      </Badge>
                    )}
                    {profile.tasting_notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 text-center">
                        {profile.tasting_notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Roast Session Profiles */}
      {hasRoast && (
        <div className="space-y-3">
          {hasCatalog && (
            <h2 className="text-lg font-semibold text-muted-foreground">
              {t("roasts.title")}
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(roastProfiles as any[]).map((profile) => {
              const roast = profile.roast_sessions;
              const lot = roast?.green_coffee_lots;
              const coffeeName = getCoffeeName(lot);
              const lotId = lot?.id;
              const imageUrl = lot?.label_image_url;

              return (
                <Link
                  key={profile.id}
                  href={lotId ? `/dashboard/estoque/${lotId}` : "#"}
                  className="block transition-transform hover:scale-[1.02]"
                >
                  <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary/20">
                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={coffeeName}
                          width={40}
                          height={40}
                          className="size-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-[#FF0100] truncate">
                          {coffeeName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {roast
                            ? new Date(roast.roast_date).toLocaleDateString()
                            : ""}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-3 pt-0">
                      <SpiderChart
                        data={{
                          acidity: profile.acidity ?? 0,
                          body: profile.body ?? 0,
                          sweetness: profile.sweetness ?? 0,
                          bitterness: profile.bitterness ?? 0,
                          aftertaste: profile.aftertaste ?? 0,
                        }}
                      />
                      {profile.sca_score && (
                        <Badge variant="secondary">
                          SCA: {profile.sca_score}
                        </Badge>
                      )}
                      {profile.tasting_notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 text-center">
                          {profile.tasting_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!hasCatalog && !hasRoast && (
        <div className="text-center py-12 text-muted-foreground">
          {t("common.noResults")}
        </div>
      )}
    </div>
  );
}
