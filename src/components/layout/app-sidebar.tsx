"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Flame,
  Wine,
  BookOpen,
  Settings,
  Coffee,
  Library,
  FileText,
  HelpCircle,
} from "lucide-react";

interface AppSidebarProps {
  profile: {
    role: string;
    full_name: string;
    store_name: string;
  };
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    {
      label: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: t("inventory"),
      href: "/dashboard/estoque",
      icon: Package,
    },
    {
      label: t("roasts"),
      href: "/dashboard/torras",
      icon: Flame,
    },
    {
      label: t("profiles"),
      href: "/dashboard/perfis",
      icon: Wine,
    },
    {
      label: t("roastedCoffee"),
      href: "/dashboard/torradas",
      icon: Coffee,
    },
    {
      label: t("catalog"),
      href: "/dashboard/catalogo",
      icon: Library,
    },
    {
      label: t("recipes"),
      href: "/dashboard/receitas",
      icon: BookOpen,
    },
    {
      label: t("manuals"),
      href: "/dashboard/manuais",
      icon: FileText,
    },
    {
      label: t("about"),
      href: "/dashboard/sobre",
      icon: HelpCircle,
    },
  ];

  if (profile.role === "admin") {
    navItems.push({
      label: t("admin"),
      href: "/dashboard/admin",
      icon: Settings,
    });
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-[#FF0100]">C</span>
            <span className="text-sidebar-foreground">+</span>
          </span>
          <span className="text-sm font-semibold text-sidebar-foreground/70 uppercase tracking-widest">
            Track
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href, item.exact)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
