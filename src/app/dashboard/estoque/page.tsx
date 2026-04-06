import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { StoreInventory } from "@/components/estoque/store-inventory";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileSpreadsheet } from "lucide-react";
import type { Tables } from "@/types/database";

export default async function EstoquePage() {
  const t = await getTranslations("inventory");
  const supabase = await createClient();

  const { data: stores } = (await supabase
    .from("stores")
    .select("id, name")
    .order("name")) as {
    data: Array<{ id: string; name: string }> | null;
  };

  const { data: lots } = (await supabase
    .from("green_coffee_lots")
    .select("*, stores:store_id(name)")
    .order("created_at", { ascending: false })) as {
    data: Array<Tables<"green_coffee_lots"> & { stores: { name: string } | null }> | null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/estoque/import">
            <Button variant="outline">
              <FileSpreadsheet data-icon="inline-start" />
              {t("importExcel")}
            </Button>
          </Link>
          <Link href="/dashboard/estoque/novo">
            <Button>
              <Plus data-icon="inline-start" />
              {t("addLot")}
            </Button>
          </Link>
        </div>
      </div>

      <StoreInventory stores={stores ?? []} lots={lots ?? []} />
    </div>
  );
}
