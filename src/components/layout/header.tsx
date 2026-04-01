"use client";

import { useTranslations } from "next-intl";
import { logout } from "@/lib/actions/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { User, LogOut } from "lucide-react";

interface HeaderProps {
  profile: {
    full_name: string;
    role: string;
    store_name: string;
  };
}

export function Header({ profile }: HeaderProps) {
  const t = useTranslations();

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <SidebarTrigger />
      <div className="flex-1" />
      <Badge className="bg-[#FF0100] text-white border-0 uppercase tracking-wider text-xs">
        {profile.store_name}
      </Badge>
      <LanguageSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <User className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {t(`roles.${profile.role}` as "roles.admin")}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            className="text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("auth.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
