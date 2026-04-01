import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { LotForm } from "@/components/estoque/lot-form";
import { DeleteLotButton } from "@/components/estoque/delete-lot-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Tables } from "@/types/database";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("green_coffee_lots")
    .select("*")
    .eq("id", id)
    .single() as { data: Tables<"green_coffee_lots"> | null };

  if (!lot) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/estoque">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("inventory.lotDetail")}</h1>
        </div>
        <DeleteLotButton lotId={lot.id} />
      </div>

      {lot.label_image_url && (
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("inventory.labelImage")}
          </p>
          <Image
            src={lot.label_image_url}
            alt="Label"
            width={400}
            height={300}
            className="rounded-md object-contain"
          />
        </div>
      )}

      <div className="max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">{t("inventory.editLot")}</h2>
        <LotForm lot={lot} />
      </div>
    </div>
  );
}
