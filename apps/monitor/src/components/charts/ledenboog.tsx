"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const BAND_KLEUREN: Record<string, string> = {
  Blauw: "#4A90D9",
  Groen: "#52B788",
  Geel: "#F4D35E",
  Oranje: "#F28C28",
  Rood: "#D62828",
};

interface LedenboogProps {
  data: { geboortejaar: number; M: number; V: number; band: string }[];
}

export function Ledenboog({ data }: LedenboogProps) {
  // Transform: M gaat naar links (negatief), V naar rechts (positief)
  const chartData = data.map((d) => ({
    geboortejaar: d.geboortejaar,
    M: -d.M,
    V: d.V,
    band: d.band,
  }));

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.M, d.V)),
    1
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 22)}>
      <BarChart data={chartData} layout="vertical" stackOffset="sign">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[-maxVal, maxVal]}
          fontSize={12}
          tickFormatter={(v: number) => String(Math.abs(v))}
        />
        <YAxis
          dataKey="geboortejaar"
          type="category"
          fontSize={11}
          width={50}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            Math.abs(value),
            name === "M" ? "Jongens" : "Meisjes",
          ]}
        />
        <ReferenceLine x={0} stroke="#666" />
        <Bar dataKey="M" stackId="stack" name="M">
          {chartData.map((entry, index) => (
            <Cell
              key={`m-${index}`}
              fill={BAND_KLEUREN[entry.band] || "#999"}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
        <Bar dataKey="V" stackId="stack" name="V">
          {chartData.map((entry, index) => (
            <Cell
              key={`v-${index}`}
              fill={BAND_KLEUREN[entry.band] || "#999"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
