import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { RoastedTable, type RoastedItem } from "@/components/torradas/roasted-table";

export default async function TorradasPage() {
  const t = await getTranslations("roastedCoffee");
  const supabase = await createClient();

  const { data: inventory } = await supabase
    .from("roasted_coffee_inventory")
    .select(
      `
      *,
      roast_sessions:roast_session_id (
        id,
        roast_level,
        roast_profile_notes,
        green_coffee_lots:green_coffee_lot_id (
          origin_country,
          variety,
          farm_producer,
          label_image_url
        )
      )
    `
    )
    .gt("current_stock_kg", 0)
    .order("roast_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <RoastedTable items={(inventory ?? []) as unknown as RoastedItem[]} />
    </div>
  );
}
