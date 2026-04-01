import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminUserList } from "@/components/admin/user-list";

export default async function AdminPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (currentProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, store_id, created_at, stores:store_id(name)")
    .order("created_at", { ascending: false }) as { data: Array<{
      id: string;
      full_name: string;
      role: string;
      store_id: string;
      created_at: string;
      stores: { name: string } | null;
    }> | null };

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .order("name") as { data: Array<{ id: string; name: string }> | null };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
      <AdminUserList
        profiles={profiles ?? []}
        stores={stores ?? []}
      />
    </div>
  );
}
