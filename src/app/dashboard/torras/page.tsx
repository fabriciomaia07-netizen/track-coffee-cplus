import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function RoastSessionsPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("roast_sessions")
    .select(
      "*, green_coffee_lots(origin_country, variety)"
    )
    .order("roast_date", { ascending: false }) as {
    data: Array<{
      id: string;
      roast_date: string;
      input_weight_kg: number;
      output_weight_kg: number;
      loss_percentage: number;
      roast_level: string;
      green_coffee_lots: { origin_country: string; variety: string } | null;
    }> | null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("roasts.title")}</h1>
        <Link href="/dashboard/torras/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("roasts.newRoast")}
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("roasts.roastDate")}</TableHead>
              <TableHead>{t("roasts.greenLot")}</TableHead>
              <TableHead>{t("roasts.inputWeight")}</TableHead>
              <TableHead>{t("roasts.outputWeight")}</TableHead>
              <TableHead>{t("roasts.lossPercentage")}</TableHead>
              <TableHead>{t("roasts.roastLevel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions && sessions.length > 0 ? (
              sessions.map((session) => {
                const lot = session.green_coffee_lots;
                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.roast_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {lot
                        ? `${lot.origin_country} - ${lot.variety}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {session.input_weight_kg} {t("common.kg")}
                    </TableCell>
                    <TableCell>
                      {session.output_weight_kg} {t("common.kg")}
                    </TableCell>
                    <TableCell>
                      {session.loss_percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`roasts.levels.${session.roast_level}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
