"use server";

import { createClient } from "@/lib/supabase/server";
import { flavorProfileSchema } from "@/lib/validations/perfis";
import { revalidatePath } from "next/cache";

export async function createFlavorProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = flavorProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  const scaScore = parsed.data.sca_score ?? null;

  const roastSessionId = parsed.data.roast_session_id || null;
  const greenCoffeeLotId = parsed.data.green_coffee_lot_id || null;

  const { error } = await supabase.from("flavor_profiles").insert({
    roast_session_id: roastSessionId,
    green_coffee_lot_id: greenCoffeeLotId,
    acidity: parsed.data.acidity,
    body: parsed.data.body,
    sweetness: parsed.data.sweetness,
    bitterness: parsed.data.bitterness,
    aftertaste: parsed.data.aftertaste,
    tasting_notes: parsed.data.tasting_notes || null,
    sca_score: scaScore,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/perfis");
  return { success: true };
}

export async function updateFlavorProfile(id: string, formData: FormData) {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData);
  const parsed = flavorProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  const scaScore = parsed.data.sca_score ?? null;

  const { error } = await supabase
    .from("flavor_profiles")
    .update({
      acidity: parsed.data.acidity,
      body: parsed.data.body,
      sweetness: parsed.data.sweetness,
      bitterness: parsed.data.bitterness,
      aftertaste: parsed.data.aftertaste,
      tasting_notes: parsed.data.tasting_notes || null,
      sca_score: scaScore,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/perfis");
  return { success: true };
}
