"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createGreenLot,
  updateGreenLot,
  uploadLabelImage,
} from "@/lib/actions/estoque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PROCESS_METHODS = ["washed", "natural", "honey", "anaerobic", "other"];

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

export function LotForm({ lot }: { lot?: LotData }) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(
    lot?.label_image_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    const result = await uploadLabelImage(fd);
    setUploading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.url) {
      setLabelUrl(result.url);
      toast.success(t("labelImage"));
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    if (labelUrl) {
      formData.set("label_image_url", labelUrl);
    }

    const result = lot
      ? await updateGreenLot(lot.id, formData)
      : await createGreenLot(formData);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(tc("save"));
    router.push("/dashboard/estoque");
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
            defaultValue={lot?.origin_country ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="farm_producer">{t("farm")}</Label>
          <Input
            id="farm_producer"
            name="farm_producer"
            defaultValue={lot?.farm_producer ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="variety">{t("variety")}</Label>
          <Input
            id="variety"
            name="variety"
            required
            defaultValue={lot?.variety ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="process_method">{t("process")}</Label>
          <select
            id="process_method"
            name="process_method"
            required
            defaultValue={lot?.process_method ?? ""}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="" disabled>
              --
            </option>
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
            defaultValue={lot?.quantity_kg ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">{t("purchaseDate")}</Label>
          <Input
            id="purchase_date"
            name="purchase_date"
            type="date"
            required
            defaultValue={lot?.purchase_date ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">{t("supplier")}</Label>
          <Input
            id="supplier"
            name="supplier"
            defaultValue={lot?.supplier ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_per_kg">{t("pricePerKg")}</Label>
          <Input
            id="price_per_kg"
            name="price_per_kg"
            type="number"
            step="0.01"
            min="0"
            defaultValue={lot?.price_per_kg ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={lot?.notes ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("labelImage")}</Label>
        <div className="flex items-center gap-4">
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="max-w-xs"
          />
          {uploading && <Loader2 className="size-4 animate-spin" />}
          {labelUrl && (
            <img
              src={labelUrl}
              alt="Label preview"
              className="size-12 rounded object-cover"
            />
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading || uploading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {tc("loading")}
            </>
          ) : (
            tc("save")
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/estoque")}
        >
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
