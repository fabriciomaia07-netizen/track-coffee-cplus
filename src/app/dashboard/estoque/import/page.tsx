import { getTranslations } from "next-intl/server";
import { ExcelImport } from "@/components/estoque/excel-import";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ImportPage() {
  const t = await getTranslations("inventory.excelImport");

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

      <div className="max-w-3xl">
        <ExcelImport />
      </div>
    </div>
  );
}
