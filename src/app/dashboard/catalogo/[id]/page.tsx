import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, MapPin, Leaf, Droplets, Mountain, Plus } from "lucide-react";
import { CoffeeEditForm } from "@/components/catalogo/coffee-edit-form";
import { CoffeeRecipeForm } from "@/components/catalogo/coffee-recipe-form";
import { CommentSection } from "@/components/receitas/comment-section";
import { deleteRecipe } from "@/lib/actions/receitas";
import { redirect } from "next/navigation";
import type { Tables } from "@/types/database";

const processColors: Record<string, string> = {
  washed: "bg-blue-100 text-blue-800",
  natural: "bg-orange-100 text-orange-800",
  honey: "bg-amber-100 text-amber-800",
  anaerobic: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

interface Recipe {
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
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  profiles: { full_name: string } | null;
}

export default async function CoffeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { data: lot } = await supabase
    .from("green_coffee_lots")
    .select("*")
    .eq("id", id)
    .single() as { data: Tables<"green_coffee_lots"> | null };

  if (!lot) notFound();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, profiles:created_by(full_name)")
    .eq("green_coffee_lot_id", id)
    .order("created_at", { ascending: false }) as {
    data: Recipe[] | null;
  };

  const coffeeName = lot.notes?.split(".")[0] || lot.origin_country;
  const description = lot.notes?.split(".").slice(1).join(".").trim() || "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/catalogo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>

      {/* Coffee Header */}
      <div className="grid gap-6 md:grid-cols-2">
        {lot.label_image_url && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
            <Image
              src={lot.label_image_url}
              alt={coffeeName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        )}

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[#FF0100]">{coffeeName}</h1>

          <div className="flex flex-wrap gap-2">
            <Badge className={processColors[lot.process_method] || processColors.other}>
              <Droplets className="mr-1 size-3" />
              {t(`catalog.processes.${lot.process_method}` as Parameters<typeof t>[0])}
            </Badge>
            {lot.current_stock_kg > 0 && (
              <Badge variant="outline">{lot.current_stock_kg} kg</Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="font-medium">{lot.origin_country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="size-4 text-muted-foreground" />
              <span className="font-medium">{lot.variety}</span>
            </div>
            {lot.farm_producer && (
              <div className="flex items-center gap-2">
                <Mountain className="size-4 text-muted-foreground" />
                <span className="font-medium">{lot.farm_producer}</span>
              </div>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {/* Edit Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("common.edit")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CoffeeEditForm lot={lot} />
        </CardContent>
      </Card>

      {/* Recipes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("recipes.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Recipe Form */}
          <CoffeeRecipeForm lotId={id} />

          {/* Existing Recipes */}
          {(recipes ?? []).length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              {(recipes ?? []).map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  lotId={id}
                  userId={user?.id}
                  isAdmin={profile?.role === "admin"}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function RecipeCard({
  recipe,
  lotId,
  userId,
  isAdmin,
}: {
  recipe: Recipe;
  lotId: string;
  userId?: string;
  isAdmin: boolean;
}) {
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("recipe_comments")
    .select("*, profiles:created_by(full_name)")
    .eq("recipe_id", recipe.id)
    .order("created_at", { ascending: true }) as {
    data: Comment[] | null;
  };

  const canDelete = userId === recipe.created_by || isAdmin;

  async function handleDelete() {
    "use server";
    await deleteRecipe(recipe.id);
    redirect(`/dashboard/catalogo/${lotId}`);
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{recipe.title}</h4>
          <p className="text-xs text-muted-foreground">
            {recipe.profiles?.full_name ?? ""} ·{" "}
            {t(`recipes.methods.${recipe.method}` as Parameters<typeof t>[0])}
          </p>
        </div>
        <div className="flex gap-1">
          {recipe.is_shared && (
            <Badge variant="secondary" className="text-xs">
              {t("recipes.shared")}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {t(`recipes.methods.${recipe.method}` as Parameters<typeof t>[0])}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {recipe.dose_grams && (
          <div>
            <span className="text-xs text-muted-foreground">{t("recipes.dose")}</span>
            <p className="font-medium">{recipe.dose_grams}{t("common.grams")}</p>
          </div>
        )}
        {recipe.water_ml && (
          <div>
            <span className="text-xs text-muted-foreground">{t("recipes.water")}</span>
            <p className="font-medium">{recipe.water_ml}{t("common.ml")}</p>
          </div>
        )}
        {recipe.temperature_celsius && (
          <div>
            <span className="text-xs text-muted-foreground">{t("recipes.temperature")}</span>
            <p className="font-medium">{recipe.temperature_celsius}{t("common.celsius")}</p>
          </div>
        )}
        {recipe.brew_time_seconds && (
          <div>
            <span className="text-xs text-muted-foreground">{t("recipes.brewTime")}</span>
            <p className="font-medium">{recipe.brew_time_seconds}{t("common.seconds")}</p>
          </div>
        )}
      </div>

      {recipe.grind_size && (
        <div className="text-sm">
          <span className="text-xs text-muted-foreground">{t("recipes.grindSize")}: </span>
          <span>{recipe.grind_size}</span>
        </div>
      )}

      {recipe.instructions && (
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {recipe.instructions}
        </p>
      )}

      <div className="pt-2">
        <CommentSection
          recipeId={recipe.id}
          comments={
            (comments ?? []).map((c) => ({
              id: c.id,
              content: c.content,
              created_at: c.created_at,
              commenter_name: c.profiles?.full_name ?? "",
            }))
          }
        />
      </div>

      {canDelete && (
        <form action={handleDelete}>
          <Button type="submit" variant="destructive" size="sm">
            {t("common.delete")}
          </Button>
        </form>
      )}
    </div>
  );
}
