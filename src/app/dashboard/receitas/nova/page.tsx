import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { RecipeForm } from "@/components/receitas/recipe-form";

export default async function NewRecipePage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("roast_sessions")
    .select("id, roast_date, roast_level, green_coffee_lots(origin_country, variety)")
    .order("roast_date", { ascending: false }) as {
    data: Array<{
      id: string;
      roast_date: string;
      roast_level: string;
      green_coffee_lots: { origin_country: string; variety: string } | null;
    }> | null;
  };

  const roastOptions = (sessions ?? []).map((s) => {
    const lot = s.green_coffee_lots;
    return {
      id: s.id,
      label: lot
        ? `${lot.origin_country} - ${lot.variety} (${new Date(s.roast_date).toLocaleDateString()})`
        : new Date(s.roast_date).toLocaleDateString(),
    };
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("recipes.newRecipe")}</h1>
      <RecipeForm roastSessions={roastOptions} />
    </div>
  );
}
