import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteRecipe } from "@/lib/actions/receitas";
import { redirect } from "next/navigation";
import { CommentSection } from "@/components/receitas/comment-section";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single() as { data: { role: string } | null }
    : { data: null };

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*, profiles:created_by(full_name)")
    .eq("id", id)
    .single() as {
    data: {
      id: string;
      title: string;
      method: string;
      dose_grams: number | null;
      water_ml: number | null;
      temperature_celsius: number | null;
      brew_time_seconds: number | null;
      grind_size: string | null;
      instructions: string | null;
      is_shared: boolean;
      created_by: string | null;
      profiles: { full_name: string } | null;
    } | null;
  };

  if (!recipe) notFound();

  const { data: comments } = await supabase
    .from("recipe_comments")
    .select("*, profiles:created_by(full_name)")
    .eq("recipe_id", id)
    .order("created_at", { ascending: true }) as {
    data: Array<{
      id: string;
      content: string;
      created_at: string;
      profiles: { full_name: string } | null;
    }> | null;
  };

  const isCreator = user?.id === recipe.created_by;
  const isAdmin = profile?.role === "admin";
  const canDelete = isCreator || isAdmin;

  const creator = recipe.profiles;

  async function handleDelete() {
    "use server";
    await deleteRecipe(id);
    redirect("/dashboard/receitas");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/receitas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{recipe.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {creator?.full_name ?? ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {recipe.is_shared && (
                <Badge variant="secondary">{t("recipes.shared")}</Badge>
              )}
              <Badge variant="outline">
                {t(`recipes.methods.${recipe.method}`)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {recipe.dose_grams && (
              <div>
                <p className="text-xs text-muted-foreground">{t("recipes.dose")}</p>
                <p className="font-medium">{recipe.dose_grams}{t("common.grams")}</p>
              </div>
            )}
            {recipe.water_ml && (
              <div>
                <p className="text-xs text-muted-foreground">{t("recipes.water")}</p>
                <p className="font-medium">{recipe.water_ml}{t("common.ml")}</p>
              </div>
            )}
            {recipe.temperature_celsius && (
              <div>
                <p className="text-xs text-muted-foreground">{t("recipes.temperature")}</p>
                <p className="font-medium">{recipe.temperature_celsius}{t("common.celsius")}</p>
              </div>
            )}
            {recipe.brew_time_seconds && (
              <div>
                <p className="text-xs text-muted-foreground">{t("recipes.brewTime")}</p>
                <p className="font-medium">{recipe.brew_time_seconds}{t("common.seconds")}</p>
              </div>
            )}
            {recipe.grind_size && (
              <div>
                <p className="text-xs text-muted-foreground">{t("recipes.grindSize")}</p>
                <p className="font-medium">{recipe.grind_size}</p>
              </div>
            )}
          </div>

          {recipe.instructions && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t("recipes.instructions")}
              </p>
              <p className="whitespace-pre-wrap text-sm">{recipe.instructions}</p>
            </div>
          )}

          {canDelete && (
            <form action={handleDelete}>
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 className="mr-1 h-4 w-4" />
                {t("common.delete")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("recipes.comments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentSection
            recipeId={id}
            comments={
              (comments ?? []).map((c) => ({
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                commenter_name:
                  c.profiles?.full_name ?? "",
              }))
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
