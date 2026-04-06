import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Flame, Wine, BookOpen, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations("dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single()) as { data: { full_name: string } | null };

  // Fetch summary stats
  const { data: greenLots } = (await supabase
    .from("green_coffee_lots")
    .select("current_stock_kg, store_id, stores:store_id(name)")) as {
    data: Array<{
      current_stock_kg: number;
      store_id: string;
      stores: { name: string } | null;
    }> | null;
  };

  const { data: roastedStock } = (await supabase
    .from("roasted_coffee_inventory")
    .select("current_stock_kg")) as {
    data: Array<{ current_stock_kg: number }> | null;
  };

  const { count: roastCount } = await supabase
    .from("roast_sessions")
    .select("*", { count: "exact", head: true });

  const { count: recipeCount } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true });

  const totalGreen =
    greenLots?.reduce((sum, lot) => sum + Number(lot.current_stock_kg), 0) ?? 0;

  const totalRoasted =
    roastedStock?.reduce(
      (sum, item) => sum + Number(item.current_stock_kg),
      0
    ) ?? 0;

  // Group green stock by store
  const storeMap = new Map<string, { name: string; stock: number }>();
  greenLots?.forEach((lot) => {
    const storeName = lot.stores?.name ?? "—";
    const existing = storeMap.get(lot.store_id);
    if (existing) {
      existing.stock += Number(lot.current_stock_kg);
    } else {
      storeMap.set(lot.store_id, {
        name: storeName,
        stock: Number(lot.current_stock_kg),
      });
    }
  });
  const storeStocks = Array.from(storeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const stats = [
    {
      title: t("greenStock"),
      value: `${totalGreen.toFixed(1)} kg`,
      icon: Package,
    },
    {
      title: t("roastedStock"),
      value: `${totalRoasted.toFixed(1)} kg`,
      icon: Flame,
    },
    {
      title: t("totalRoasts"),
      value: roastCount ?? 0,
      icon: Wine,
    },
    {
      title: t("totalRecipes"),
      value: recipeCount ?? 0,
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {t("welcome", { name: profile?.full_name ?? "" })}
      </h1>

      {/* Main stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-store green stock */}
      {storeStocks.length > 1 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted-foreground">
            {t("stockByStore")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {storeStocks.map((store) => (
              <Card key={store.name}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {store.name}
                    </p>
                    <p className="text-xl font-bold">
                      {store.stock.toFixed(1)} kg
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
