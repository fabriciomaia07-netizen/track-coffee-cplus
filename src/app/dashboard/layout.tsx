import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, store_id, stores:store_id(name)")
    .eq("id", user.id)
    .single() as {
    data: {
      full_name: string;
      role: string;
      store_id: string;
      stores: { name: string } | null;
    } | null;
  };

  if (!profile) redirect("/login");

  const storeName = profile.stores?.name ?? "";

  const profileData = {
    full_name: profile.full_name,
    role: profile.role,
    store_name: storeName,
  };

  return (
    <SidebarProvider>
      <AppSidebar profile={profileData} />
      <SidebarInset>
        <Header profile={profileData} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
