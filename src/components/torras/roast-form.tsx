"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createRoastSession } from "@/lib/actions/torras";
import { toast } from "sonner";
import { getCoffeeName } from "@/lib/utils";
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

interface Lot {
  id: string;
  origin_country: string;
  variety: string;
  current_stock_kg: number;
  notes: string | null;
}

interface RoastFormProps {
  lots: Lot[];
}

export function RoastForm({ lots }: RoastFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inputWeight, setInputWeight] = useState("");
  const [outputWeight, setOutputWeight] = useState("");
  const [autoEstimate, setAutoEstimate] = useState(true);

  const estimatedLossPercent: Record<string, number> = {
    light: 12,
    medium: 15,
    "medium-dark": 17,
    dark: 20,
  };
  const [roastLevel, setRoastLevel] = useState("medium");

  const lossPercent =
    inputWeight && outputWeight
      ? (
          ((parseFloat(inputWeight) - parseFloat(outputWeight)) /
            parseFloat(inputWeight)) *
          100
        ).toFixed(1)
      : null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createRoastSession(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(t("common.save"));
      router.push("/dashboard/torras");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("roasts.newRoast")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="green_coffee_lot_id">{t("roasts.greenLot")}</Label>
            <Select name="green_coffee_lot_id" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("roasts.greenLot")} />
              </SelectTrigger>
              <SelectContent>
                {lots.map((lot) => {
                  const coffeeName = getCoffeeName(lot);
                  return (
                    <SelectItem key={lot.id} value={lot.id}>
                      {coffeeName} ({t("roasts.availableStock", { stock: lot.current_stock_kg })})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roast_date">{t("roasts.roastDate")}</Label>
            <Input
              id="roast_date"
              name="roast_date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input_weight_kg">{t("roasts.inputWeight")}</Label>
              <Input
                id="input_weight_kg"
                name="input_weight_kg"
                type="number"
                step="0.01"
                min="0"
                required
                value={inputWeight}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputWeight(val);
                  if (autoEstimate && val) {
                    const loss = estimatedLossPercent[roastLevel] || 15;
                    setOutputWeight(
                      (parseFloat(val) * (1 - loss / 100)).toFixed(2)
                    );
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="output_weight_kg">{t("roasts.outputWeight")}</Label>
              <Input
                id="output_weight_kg"
                name="output_weight_kg"
                type="number"
                step="0.01"
                min="0"
                required
                value={outputWeight}
                onChange={(e) => {
                  setOutputWeight(e.target.value);
                  setAutoEstimate(false);
                }}
              />
              {autoEstimate && outputWeight && (
                <p className="text-xs text-muted-foreground">
                  {t("roasts.estimatedLoss", {
                    percent: estimatedLossPercent[roastLevel] || 15,
                  })}
                </p>
              )}
            </div>
          </div>

          {lossPercent !== null && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <span className="text-sm text-muted-foreground">
                {t("roasts.lossPercentage")}:{" "}
              </span>
              <span className="text-lg font-semibold">{lossPercent}%</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="roast_level">{t("roasts.roastLevel")}</Label>
            <Select
              name="roast_level"
              required
              defaultValue="medium"
              onValueChange={(val) => {
                const level = (val as string) ?? "medium";
                setRoastLevel(level);
                if (autoEstimate && inputWeight) {
                  const loss = estimatedLossPercent[level] || 15;
                  setOutputWeight(
                    (parseFloat(inputWeight) * (1 - loss / 100)).toFixed(2)
                  );
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("roasts.roastLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("roasts.levels.light")}</SelectItem>
                <SelectItem value="medium">{t("roasts.levels.medium")}</SelectItem>
                <SelectItem value="medium-dark">{t("roasts.levels.medium-dark")}</SelectItem>
                <SelectItem value="dark">{t("roasts.levels.dark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature_notes">{t("roasts.temperatureNotes")}</Label>
            <Textarea
              id="temperature_notes"
              name="temperature_notes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roast_profile_notes">{t("roasts.profileNotes")}</Label>
            <Textarea
              id="roast_profile_notes"
              name="roast_profile_notes"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/torras")}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
