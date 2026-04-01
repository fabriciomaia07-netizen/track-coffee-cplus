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

export default async function RecipesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, profiles:created_by(full_name)")
    .order("created_at", { ascending: false }) as {
    data: Array<{
      id: string;
      title: string;
      method: string;
      dose_grams: number | null;
      water_ml: number | null;
      is_shared: boolean;
      profiles: { full_name: string } | null;
    }> | null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("recipes.title")}</h1>
        <Link href="/dashboard/receitas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("recipes.newRecipe")}
          </Button>
        </Link>
      </div>

      {recipes && recipes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const creator = recipe.profiles;

            return (
              <Link
                key={recipe.id}
                href={`/dashboard/receitas/${recipe.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {recipe.title}
                      </CardTitle>
                      {recipe.is_shared && (
                        <Badge variant="secondary">{t("recipes.shared")}</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {creator?.full_name ?? ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {t(`recipes.methods.${recipe.method}`)}
                      </Badge>
                      {recipe.dose_grams && (
                        <span>
                          {recipe.dose_grams}{t("common.grams")}
                        </span>
                      )}
                      {recipe.water_ml && (
                        <span>
                          {recipe.water_ml}{t("common.ml")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
