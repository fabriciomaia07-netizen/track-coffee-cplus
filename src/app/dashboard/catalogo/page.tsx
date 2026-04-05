import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CatalogGrid } from "@/components/catalogo/catalog-grid";
import type { Tables } from "@/types/database";

export default async function CatalogoPage() {
  const t = await getTranslations("catalog");
  const supabase = await createClient();

  const { data: lots } = (await supabase
    .from("green_coffee_lots")
    .select("*")
    .order("notes", { ascending: true })) as {
    data: Tables<"green_coffee_lots">[] | null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <CatalogGrid lots={lots ?? []} />
    </div>
  );
}
