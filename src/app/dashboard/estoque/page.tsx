import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { LotTable } from "@/components/estoque/lot-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileSpreadsheet } from "lucide-react";
import type { Tables } from "@/types/database";

export default async function EstoquePage() {
  const t = await getTranslations("inventory");
  const supabase = await createClient();

  const { data: lots } = await supabase
    .from("green_coffee_lots")
    .select("*")
    .order("created_at", { ascending: false }) as {
    data: Tables<"green_coffee_lots">[] | null;
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

      <LotTable lots={lots ?? []} />
    </div>
  );
}
