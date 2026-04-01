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

export default async function FlavorProfilesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("flavor_profiles")
    .select(
      "*, roast_sessions(id, roast_date, roast_level, green_coffee_lots(origin_country, variety))"
    )
    .order("created_at", { ascending: false }) as {
    data: Array<{
      id: string;
      acidity: number | null;
      body: number | null;
      sweetness: number | null;
      bitterness: number | null;
      aftertaste: number | null;
      tasting_notes: string | null;
      sca_score: number | null;
      roast_sessions: {
        id: string;
        roast_date: string;
        roast_level: string;
        green_coffee_lots: { origin_country: string; variety: string } | null;
      } | null;
    }> | null;
  };

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

      {profiles && profiles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const roast = profile.roast_sessions;

            const coffeeName = roast?.green_coffee_lots
              ? `${roast.green_coffee_lots.origin_country} - ${roast.green_coffee_lots.variety}`
              : "-";

            return (
              <Card key={profile.id}>
                <CardHeader>
                  <CardTitle className="text-base">{coffeeName}</CardTitle>
                  <CardDescription>
                    {roast
                      ? new Date(roast.roast_date).toLocaleDateString()
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {t("common.noResults")}
        </div>
      )}
    </div>
  );
}
