"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface SpiderChartProps {
  data: {
    acidity: number;
    body: number;
    sweetness: number;
    bitterness: number;
    aftertaste: number;
  };
}

export function SpiderChart({ data }: SpiderChartProps) {
  const chartData = [
    { attribute: "Acidity", value: data.acidity },
    { attribute: "Body", value: data.body },
    { attribute: "Sweetness", value: data.sweetness },
    { attribute: "Bitterness", value: data.bitterness },
    { attribute: "Aftertaste", value: data.aftertaste },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="attribute"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Profile"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
