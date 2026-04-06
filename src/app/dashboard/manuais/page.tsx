import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Coffee,
  Shirt,
  SprayCan,
  GlassWater,
  ClipboardList,
} from "lucide-react";

const manuals = [
  {
    key: "espressoMilk",
    file: "/manuais/barista-manual-espresso-milk.pdf",
    icon: Coffee,
    color: "bg-amber-100 text-amber-800",
    sizeKb: 191,
  },
  {
    key: "filterCoffee",
    file: "/manuais/barista-manual-filter-coffee.pdf",
    icon: GlassWater,
    color: "bg-blue-100 text-blue-800",
    sizeKb: 166,
  },
  {
    key: "drinkPreparation",
    file: "/manuais/drink-preparation-guide.pdf",
    icon: ClipboardList,
    color: "bg-green-100 text-green-800",
    sizeKb: 580,
  },
  {
    key: "cleaningStandards",
    file: "/manuais/cleaning-station-standards.pdf",
    icon: SprayCan,
    color: "bg-purple-100 text-purple-800",
    sizeKb: 1245,
  },
  {
    key: "baristaAttire",
    file: "/manuais/barista-attire-guide.pdf",
    icon: Shirt,
    color: "bg-pink-100 text-pink-800",
    sizeKb: 104,
  },
  {
    key: "pocketWorkflow",
    file: "/manuais/pocket-workflow-guide.pdf",
    icon: FileText,
    color: "bg-orange-100 text-orange-800",
    sizeKb: 567,
  },
] as const;

function formatSize(kb: number) {
  if (kb >= 1000) return `${(kb / 1000).toFixed(1)} MB`;
  return `${kb} KB`;
}

export default async function ManuaisPage() {
  const t = await getTranslations("manuals");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {manuals.map((manual) => {
          const Icon = manual.icon;
          return (
            <a
              key={manual.key}
              href={manual.file}
              download
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge className={manual.color}>
                      <Icon className="mr-1 size-3" />
                      {t(`categories.${manual.key}` as Parameters<typeof t>[0])}
                    </Badge>
                    <Download className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="text-base leading-snug">
                    {t(`items.${manual.key}.title` as Parameters<typeof t>[0])}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t(`items.${manual.key}.description` as Parameters<typeof t>[0])}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    PDF · {formatSize(manual.sizeKb)}
                  </p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
