"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Not authenticated" as const };

  const { data: currentProfile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };

  if (currentProfile?.role !== "admin") {
    return { supabase, error: "Not authorized" as const };
  }

  return { supabase, error: null };
}

export async function updateUserRole(userId: string, role: string) {
  const { supabase, error: authError } = await checkAdmin();
  if (authError) return { error: authError };

  if (!["admin", "torrador", "barista"].includes(role)) {
    return { error: "Invalid role" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("profiles") as any)
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function updateUserStore(userId: string, storeId: string) {
  const { supabase, error: authError } = await checkAdmin();
  if (authError) return { error: authError };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("profiles") as any)
    .update({ store_id: storeId })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  return { success: true };
}
