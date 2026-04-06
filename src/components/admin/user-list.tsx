"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  updateUserRole,
  updateUserStore,
  createUser,
  deleteUser,
} from "@/lib/actions/admin";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

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
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

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

  async function handleCreateUser(formData: FormData) {
    setCreating(true);
    const result = await createUser({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullName: formData.get("fullName") as string,
      role: formData.get("role") as string,
      storeId: formData.get("storeId") as string,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.userCreated"));
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm(t("admin.confirmDelete"))) return;
    setUpdating(userId);
    const result = await deleteUser(userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User deleted");
    }
    setUpdating(null);
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    torrador: "bg-orange-100 text-orange-800",
    barista: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      {/* Create User Section */}
      <div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("admin.createUser")}
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.createUser")}</CardTitle>
              <CardDescription>{t("admin.createUserDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t("auth.role")}</Label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue="barista"
                    >
                      <option value="barista">{t("roles.barista")}</option>
                      <option value="torrador">{t("roles.torrador")}</option>
                      <option value="admin">{t("roles.admin")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeId">{t("auth.store")}</Label>
                    <select
                      id="storeId"
                      name="storeId"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={stores[0]?.id}
                    >
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? t("common.loading") : t("common.create")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User List */}
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
                <TableHead className="w-[60px]"></TableHead>
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
                      onValueChange={(v) =>
                        v && handleRoleChange(profile.id, v)
                      }
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
                      onValueChange={(v) =>
                        v && handleStoreChange(profile.id, v)
                      }
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUser(profile.id)}
                      disabled={updating === profile.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
