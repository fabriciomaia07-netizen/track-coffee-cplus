"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { updateUserRole, updateUserStore } from "@/lib/actions/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  store_id: string;
  created_at: string;
  stores: { name: string } | null;
}

interface Store {
  id: string;
  name: string;
}

export function AdminUserList({
  profiles,
  stores,
}: {
  profiles: Profile[];
  stores: Store[];
}) {
  const t = useTranslations();
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: string) {
    setUpdating(userId);
    const result = await updateUserRole(userId, role);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Role updated");
    }
    setUpdating(null);
  }

  async function handleStoreChange(userId: string, storeId: string) {
    setUpdating(userId);
    const result = await updateUserStore(userId, storeId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Store updated");
    }
    setUpdating(null);
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    torrador: "bg-orange-100 text-orange-800",
    barista: "bg-blue-100 text-blue-800",
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{t("admin.userList")}</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("auth.fullName")}</TableHead>
              <TableHead>{t("auth.store")}</TableHead>
              <TableHead>{t("auth.role")}</TableHead>
              <TableHead>{t("admin.changeRole")}</TableHead>
              <TableHead>{t("admin.changeStore")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.full_name}
                </TableCell>
                <TableCell>{profile.stores?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={roleColors[profile.role] || ""}
                  >
                    {t(`roles.${profile.role}` as "roles.admin")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={profile.role}
                    onValueChange={(v) => v && handleRoleChange(profile.id, v)}
                    disabled={updating === profile.id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        {t("roles.admin")}
                      </SelectItem>
                      <SelectItem value="torrador">
                        {t("roles.torrador")}
                      </SelectItem>
                      <SelectItem value="barista">
                        {t("roles.barista")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={profile.store_id}
                    onValueChange={(v) => v && handleStoreChange(profile.id, v)}
                    disabled={updating === profile.id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
