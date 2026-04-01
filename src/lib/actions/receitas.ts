"use server";

import { createClient } from "@/lib/supabase/server";
import { recipeSchema, commentSchema } from "@/lib/validations/receitas";
import { revalidatePath } from "next/cache";

export async function createRecipe(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = recipeSchema.safeParse({
    ...raw,
    is_shared: raw.is_shared === "true",
  });
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single() as { data: { store_id: string } | null };

  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase.from("recipes").insert({
    store_id: profile.store_id,
    title: parsed.data.title,
    method: parsed.data.method,
    roast_session_id: parsed.data.roast_session_id ?? null,
    dose_grams: parsed.data.dose_grams ?? null,
    water_ml: parsed.data.water_ml ?? null,
    temperature_celsius: parsed.data.temperature_celsius ?? null,
    brew_time_seconds: parsed.data.brew_time_seconds ?? null,
    grind_size: parsed.data.grind_size || null,
    instructions: parsed.data.instructions || null,
    is_shared: parsed.data.is_shared,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/receitas");
  return { success: true };
}

export async function updateRecipe(id: string, formData: FormData) {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData);
  const parsed = recipeSchema.safeParse({
    ...raw,
    is_shared: raw.is_shared === "true",
  });
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  const { error } = await supabase
    .from("recipes")
    .update({
      title: parsed.data.title,
      method: parsed.data.method,
      dose_grams: parsed.data.dose_grams ?? null,
      water_ml: parsed.data.water_ml ?? null,
      temperature_celsius: parsed.data.temperature_celsius ?? null,
      brew_time_seconds: parsed.data.brew_time_seconds ?? null,
      grind_size: parsed.data.grind_size || null,
      instructions: parsed.data.instructions || null,
      is_shared: parsed.data.is_shared,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/receitas");
  return { success: true };
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/receitas");
  return { success: true };
}

export async function addComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = commentSchema.safeParse({
    content: formData.get("content"),
    recipe_id: formData.get("recipe_id"),
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { error } = await supabase.from("recipe_comments").insert({
    recipe_id: parsed.data.recipe_id,
    content: parsed.data.content,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/receitas/${parsed.data.recipe_id}`);
  return { success: true };
}

export async function deleteComment(id: string, recipeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipe_comments")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/receitas/${recipeId}`);
  return { success: true };
}
