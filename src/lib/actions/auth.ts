"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function verifySitePassword(formData: FormData) {
  const password = formData.get("site_password") as string;
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || password !== sitePassword) {
    return { error: "Invalid password" };
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("site_access", "granted", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
  });

  redirect("/login");
}

export async function setLocale(locale: string) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
