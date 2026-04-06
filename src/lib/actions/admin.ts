"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
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

export async function createUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  storeId: string;
}) {
  const { error: authError } = await checkAdmin();
  if (authError) return { error: authError };

  if (!["admin", "torrador", "barista"].includes(data.role)) {
    return { error: "Invalid role" };
  }

  const adminClient = createAdminClient();

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

  if (createError) return { error: createError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (adminClient
    .from("profiles") as any)
    .update({
      full_name: data.fullName,
      role: data.role,
      store_id: data.storeId,
    })
    .eq("id", newUser.user.id);

  if (profileError) return { error: profileError.message };

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const { supabase, error: authError } = await checkAdmin();
  if (authError) return { error: authError };

  // Prevent self-deletion
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (currentUser?.id === userId) {
    return { error: "Cannot delete yourself" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

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
