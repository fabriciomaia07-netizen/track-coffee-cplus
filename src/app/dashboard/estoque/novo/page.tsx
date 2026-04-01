import { getTranslations } from "next-intl/server";
import { LotForm } from "@/components/estoque/lot-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NovoLotePage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/estoque">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("inventory.addLot")}</h1>
      </div>

      <div className="max-w-2xl">
        <LotForm />
      </div>
    </div>
  );
}
