"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { register } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coffee } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function RegisterPage() {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function fetchStores() {
      const supabase = createClient();
      const { data } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");
      if (data) setStores(data);
    }
    fetchStores();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <span className="text-4xl font-bold tracking-tight">
              <span className="text-[#FF0100]">C</span>
              <span className="text-[#151515]">+</span>
            </span>
          </div>
          <CardTitle className="text-xl text-[#151515]">Track Coffee</CardTitle>
          <CardDescription>{t("auth.register")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("auth.fullName")}</Label>
              <Input id="full_name" name="full_name" required minLength={2} />
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
              <Label>{t("auth.store")}</Label>
              <Select name="store_id" required>
                <SelectTrigger>
                  <SelectValue placeholder={t("auth.store")} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id} label={store.name}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.role")}</Label>
              <Select name="role" required>
                <SelectTrigger>
                  <SelectValue placeholder={t("auth.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  <SelectItem value="torrador">
                    {t("roles.torrador")}
                  </SelectItem>
                  <SelectItem value="barista">{t("roles.barista")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.register")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-primary underline">
              {t("auth.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
