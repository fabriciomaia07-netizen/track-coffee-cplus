"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { updateGreenLot } from "@/lib/actions/estoque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PROCESS_METHODS } from "@/lib/constants";

interface LotData {
  id: string;
  origin_country: string;
  farm_producer: string | null;
  variety: string;
  process_method: string;
  quantity_kg: number;
  purchase_date: string;
  supplier: string | null;
  price_per_kg: number | null;
  notes: string | null;
  label_image_url: string | null;
}

export function CoffeeEditForm({ lot }: { lot: LotData }) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    if (lot.label_image_url) {
      formData.set("label_image_url", lot.label_image_url);
    }

    const result = await updateGreenLot(lot.id, formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(tc("save"));
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="origin_country">{t("origin")}</Label>
          <Input
            id="origin_country"
            name="origin_country"
            required
            defaultValue={lot.origin_country}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="farm_producer">{t("farm")}</Label>
          <Input
            id="farm_producer"
            name="farm_producer"
            defaultValue={lot.farm_producer ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="variety">{t("variety")}</Label>
          <Input
            id="variety"
            name="variety"
            required
            defaultValue={lot.variety}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="process_method">{t("process")}</Label>
          <select
            id="process_method"
            name="process_method"
            required
            defaultValue={lot.process_method}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {PROCESS_METHODS.map((method) => (
              <option key={method} value={method}>
                {t(`processes.${method}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_kg">{t("quantity")}</Label>
          <Input
            id="quantity_kg"
            name="quantity_kg"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={lot.quantity_kg}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">{t("purchaseDate")}</Label>
          <Input
            id="purchase_date"
            name="purchase_date"
            type="date"
            required
            defaultValue={lot.purchase_date}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={lot.notes ?? ""}
        />
      </div>

      {/* Hidden fields */}
      <input type="hidden" name="supplier" value={lot.supplier ?? ""} />
      <input type="hidden" name="price_per_kg" value={lot.price_per_kg ?? ""} />

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {tc("loading")}
          </>
        ) : (
          tc("save")
        )}
      </Button>
    </form>
  );
}
