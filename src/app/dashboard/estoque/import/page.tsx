import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { ExcelImport } from "@/components/estoque/excel-import";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ImportPage() {
  const t = await getTranslations("inventory.excelImport");
  const supabase = await createClient();

  // Fetch existing coffees for matching
  const { data: existingLots } = (await supabase
    .from("green_coffee_lots")
    .select("id, origin_country, variety, process_method, notes")) as {
    data: Array<{
      id: string;
      origin_country: string;
      variety: string;
      process_method: string;
      notes: string | null;
    }> | null;
  };

  // Build unique coffee names from existing lots
  const existingCoffees = (existingLots ?? []).map((lot) => ({
    id: lot.id,
    name: lot.notes?.trim() || lot.origin_country,
    origin_country: lot.origin_country,
    variety: lot.variety,
    process_method: lot.process_method,
  }));

  // Deduplicate by name
  const uniqueCoffees = Array.from(
    new Map(existingCoffees.map((c) => [c.name.toLowerCase(), c])).values()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/estoque">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <div className="max-w-4xl">
        <ExcelImport existingCoffees={uniqueCoffees} />
      </div>
    </div>
  );
}
