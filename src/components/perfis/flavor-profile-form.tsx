"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createFlavorProfile } from "@/lib/actions/perfis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoastOption {
  id: string;
  label: string;
}

interface FlavorProfileFormProps {
  roastSessions: RoastOption[];
}

const ATTRIBUTES = ["acidity", "body", "sweetness", "bitterness", "aftertaste"] as const;

export function FlavorProfileForm({ roastSessions }: FlavorProfileFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({
    acidity: 3,
    body: 3,
    sweetness: 3,
    bitterness: 3,
    aftertaste: 3,
  });

  function handleSliderChange(attr: string, value: number) {
    setValues((prev) => ({ ...prev, [attr]: value }));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createFlavorProfile(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(t("common.save"));
      router.push("/dashboard/perfis");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profiles.newProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roast_session_id">{t("profiles.roastSession")}</Label>
            <Select name="roast_session_id" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("profiles.roastSession")} />
              </SelectTrigger>
              <SelectContent>
                {roastSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {ATTRIBUTES.map((attr) => (
              <div key={attr} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={attr}>
                    {t(`profiles.${attr}`)}
                  </Label>
                  <span className="text-sm font-medium tabular-nums w-6 text-right">
                    {values[attr]}
                  </span>
                </div>
                <input
                  type="range"
                  id={attr}
                  name={attr}
                  min={1}
                  max={5}
                  step={1}
                  value={values[attr]}
                  onChange={(e) =>
                    handleSliderChange(attr, parseInt(e.target.value))
                  }
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasting_notes">{t("profiles.tastingNotes")}</Label>
            <Textarea
              id="tasting_notes"
              name="tasting_notes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sca_score">{t("profiles.scaScore")}</Label>
            <Input
              id="sca_score"
              name="sca_score"
              type="number"
              min={0}
              max={100}
              step={0.1}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/perfis")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
