"use client";

import { useState } from "react";
import { verifySitePassword } from "@/lib/actions/auth";
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
import { Lock } from "lucide-react";

export default function GatePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await verifySitePassword(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <span className="text-4xl font-bold tracking-tight">
              <span className="text-[#FF0100]">C</span>
              <span className="text-[#151515]">+</span>
            </span>
          </div>
          <CardTitle className="text-xl text-[#151515]">Track Coffee</CardTitle>
          <CardDescription className="flex items-center justify-center gap-1">
            <Lock className="size-3" />
            Protected Site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_password">Site Password</Label>
              <Input
                id="site_password"
                name="site_password"
                type="password"
                required
                placeholder="Enter site password"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Enter Site"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
