"use server";

import { createClient } from "@/lib/supabase/server";
import { greenLotSchema } from "@/lib/validations/estoque";
import { revalidatePath } from "next/cache";

export async function createGreenLot(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = greenLotSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single() as { data: { store_id: string } | null };

  if (!profile) return { error: "Profile not found" };

  const pricePerKg = parsed.data.price_per_kg ?? null;

  const { error } = await supabase.from("green_coffee_lots").insert({
    store_id: profile.store_id,
    origin_country: parsed.data.origin_country,
    farm_producer: parsed.data.farm_producer || null,
    variety: parsed.data.variety,
    process_method: parsed.data.process_method,
    quantity_kg: parsed.data.quantity_kg,
    current_stock_kg: parsed.data.quantity_kg,
    purchase_date: parsed.data.purchase_date,
    supplier: parsed.data.supplier || null,
    price_per_kg: pricePerKg,
    notes: parsed.data.notes || null,
    label_image_url: (formData.get("label_image_url") as string) || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/estoque");
  return { success: true };
}

export async function updateGreenLot(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = greenLotSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  const pricePerKg = parsed.data.price_per_kg ?? null;

  const { error } = await supabase
    .from("green_coffee_lots")
    .update({
      origin_country: parsed.data.origin_country,
      farm_producer: parsed.data.farm_producer || null,
      variety: parsed.data.variety,
      process_method: parsed.data.process_method,
      quantity_kg: parsed.data.quantity_kg,
      current_stock_kg: parsed.data.quantity_kg,
      purchase_date: parsed.data.purchase_date,
      supplier: parsed.data.supplier || null,
      price_per_kg: pricePerKg,
      notes: parsed.data.notes || null,
      label_image_url: (formData.get("label_image_url") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/estoque");
  return { success: true };
}

export async function deleteGreenLot(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("green_coffee_lots")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/estoque");
  return { success: true };
}

export async function importGreenLotsFromExcel(
  lots: Array<{
    origin_country: string;
    variety: string;
    process_method: string;
    quantity_kg: number;
    purchase_date: string;
    supplier?: string;
    farm_producer?: string;
    price_per_kg?: number;
    notes?: string;
  }>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single() as { data: { store_id: string } | null };

  if (!profile) return { error: "Profile not found" };

  const rows = lots.map((lot) => ({
    store_id: profile.store_id,
    origin_country: lot.origin_country,
    farm_producer: lot.farm_producer || null,
    variety: lot.variety,
    process_method: lot.process_method,
    quantity_kg: lot.quantity_kg,
    current_stock_kg: lot.quantity_kg,
    purchase_date: lot.purchase_date,
    supplier: lot.supplier || null,
    price_per_kg: lot.price_per_kg || null,
    notes: lot.notes || null,
    created_by: user.id,
  }));

  const { error } = await supabase.from("green_coffee_lots").insert(rows);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/estoque");
  return { success: true, count: rows.length };
}

export async function uploadLabelImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("labels")
    .upload(fileName, file);

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("labels").getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}
