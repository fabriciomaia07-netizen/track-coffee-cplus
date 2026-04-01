import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { RoastForm } from "@/components/torras/roast-form";

export default async function NewRoastPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: lots } = await supabase
    .from("green_coffee_lots")
    .select("id, origin_country, variety, current_stock_kg")
    .gt("current_stock_kg", 0)
    .order("origin_country") as {
    data: Array<{
      id: string;
      origin_country: string;
      variety: string;
      current_stock_kg: number;
    }> | null;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("roasts.newRoast")}</h1>
      <RoastForm lots={lots ?? []} />
    </div>
  );
}
