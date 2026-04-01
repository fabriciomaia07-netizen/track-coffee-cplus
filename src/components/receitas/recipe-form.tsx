"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/lib/actions/receitas";
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

interface RecipeFormProps {
  roastSessions: RoastOption[];
}

const METHODS = [
  "espresso",
  "v60",
  "french_press",
  "aeropress",
  "chemex",
  "cold_brew",
  "moka_pot",
  "weber_bird",
  "other",
] as const;

export function RecipeForm({ roastSessions }: RecipeFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isShared, setIsShared] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set("is_shared", isShared.toString());
    const result = await createRecipe(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(t("common.save"));
      router.push("/dashboard/receitas");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recipes.newRecipe")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("recipes.recipeTitle")}</Label>
            <Input id="title" name="title" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">{t("recipes.method")}</Label>
            <Select name="method" required defaultValue="espresso">
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("recipes.method")} />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {t(`recipes.methods.${method}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roast_session_id">
              {t("profiles.roastSession")}
            </Label>
            <Select name="roast_session_id">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dose_grams">{t("recipes.dose")}</Label>
              <Input
                id="dose_grams"
                name="dose_grams"
                type="number"
                step="0.1"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water_ml">{t("recipes.water")}</Label>
              <Input
                id="water_ml"
                name="water_ml"
                type="number"
                step="1"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature_celsius">
                {t("recipes.temperature")}
              </Label>
              <Input
                id="temperature_celsius"
                name="temperature_celsius"
                type="number"
                step="1"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brew_time_seconds">{t("recipes.brewTime")}</Label>
              <Input
                id="brew_time_seconds"
                name="brew_time_seconds"
                type="number"
                step="1"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grind_size">{t("recipes.grindSize")}</Label>
            <Input id="grind_size" name="grind_size" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">{t("recipes.instructions")}</Label>
            <Textarea id="instructions" name="instructions" rows={4} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_shared"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="is_shared" className="cursor-pointer">
              {t("recipes.shareWithStores")}
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/receitas")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
