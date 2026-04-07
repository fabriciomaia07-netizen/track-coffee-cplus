import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Flame,
  Wine,
  BookOpen,
  Coffee,
  Library,
  FileText,
  Users,
  ArrowRightLeft,
  BarChart3,
  Upload,
} from "lucide-react";

export default async function AboutPage() {
  const t = await getTranslations("about");

  const features = [
    { icon: Package, title: t("features.inventory.title"), desc: t("features.inventory.desc") },
    { icon: Flame, title: t("features.roasts.title"), desc: t("features.roasts.desc") },
    { icon: Coffee, title: t("features.roasted.title"), desc: t("features.roasted.desc") },
    { icon: Wine, title: t("features.profiles.title"), desc: t("features.profiles.desc") },
    { icon: BookOpen, title: t("features.recipes.title"), desc: t("features.recipes.desc") },
    { icon: Library, title: t("features.catalog.title"), desc: t("features.catalog.desc") },
    { icon: FileText, title: t("features.manuals.title"), desc: t("features.manuals.desc") },
    { icon: Upload, title: t("features.import.title"), desc: t("features.import.desc") },
    { icon: ArrowRightLeft, title: t("features.multistore.title"), desc: t("features.multistore.desc") },
    { icon: Users, title: t("features.roles.title"), desc: t("features.roles.desc") },
    { icon: BarChart3, title: t("features.dashboard.title"), desc: t("features.dashboard.desc") },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground text-lg">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-[#FF0100]">C</span>
              <span>+</span>
            </span>
            Track Coffee
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("purpose")}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">{t("featuresTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <f.icon className="h-5 w-5 text-[#FF0100]" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("rolesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-6 items-center rounded-md bg-red-100 px-2 text-xs font-medium text-red-800">Admin</span>
            <p className="text-sm text-muted-foreground">{t("rolesAdmin")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-6 items-center rounded-md bg-orange-100 px-2 text-xs font-medium text-orange-800">{t("roaster")}</span>
            <p className="text-sm text-muted-foreground">{t("rolesRoaster")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-6 items-center rounded-md bg-blue-100 px-2 text-xs font-medium text-blue-800">Barista</span>
            <p className="text-sm text-muted-foreground">{t("rolesBarista")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
