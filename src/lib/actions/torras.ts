"use server";

import { createClient } from "@/lib/supabase/server";
import { roastSessionSchema } from "@/lib/validations/torras";
import { revalidatePath } from "next/cache";

export async function createRoastSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = roastSessionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  if (parsed.data.output_weight_kg >= parsed.data.input_weight_kg) {
    return { error: "Output weight must be less than input weight" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single() as { data: { store_id: string } | null };

  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase.from("roast_sessions").insert({
    store_id: profile.store_id,
    green_coffee_lot_id: parsed.data.green_coffee_lot_id,
    roast_date: parsed.data.roast_date,
    input_weight_kg: parsed.data.input_weight_kg,
    output_weight_kg: parsed.data.output_weight_kg,
    roast_level: parsed.data.roast_level,
    temperature_notes: parsed.data.temperature_notes || null,
    roast_profile_notes: parsed.data.roast_profile_notes || null,
    roasted_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/torras");
  revalidatePath("/dashboard/estoque");
  return { success: true };
}
