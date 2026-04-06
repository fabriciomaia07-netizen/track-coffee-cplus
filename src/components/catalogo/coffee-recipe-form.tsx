"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createRecipeForCoffee } from "@/lib/actions/receitas";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { BREW_METHODS } from "@/lib/constants";

export function CoffeeRecipeForm({ lotId }: { lotId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set("green_coffee_lot_id", lotId);
    formData.set("is_shared", "true");
    const result = await createRecipeForCoffee(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(t("common.save"));
      setOpen(false);
      setLoading(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {t("recipes.newRecipe")}
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recipe-title">{t("recipes.recipeTitle")}</Label>
          <Input id="recipe-title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipe-method">{t("recipes.method")}</Label>
          <Select name="method" required defaultValue="espresso">
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("recipes.method")} />
            </SelectTrigger>
            <SelectContent>
              {BREW_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {t(`recipes.methods.${method}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="recipe-dose">{t("recipes.dose")}</Label>
          <Input
            id="recipe-dose"
            name="dose_grams"
            type="number"
            step="0.1"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipe-water">{t("recipes.water")}</Label>
          <Input
            id="recipe-water"
            name="water_ml"
            type="number"
            step="1"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipe-temp">{t("recipes.temperature")}</Label>
          <Input
            id="recipe-temp"
            name="temperature_celsius"
            type="number"
            step="1"
            min="0"
            max="100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipe-time">{t("recipes.brewTime")}</Label>
          <Input
            id="recipe-time"
            name="brew_time_seconds"
            type="number"
            step="1"
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipe-grind">{t("recipes.grindSize")}</Label>
        <Input id="recipe-grind" name="grind_size" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipe-instructions">{t("recipes.instructions")}</Label>
        <Textarea id="recipe-instructions" name="instructions" rows={3} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("common.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
