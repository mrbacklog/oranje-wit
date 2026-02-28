"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface RetentieCurveProps {
  factoren: { M: Record<number, number>; V: Record<number, number> };
}

export function RetentieCurve({ factoren }: RetentieCurveProps) {
  const data = [];
  for (let leeftijd = 7; leeftijd <= 17; leeftijd++) {
    data.push({
      leeftijd,
      jongens: factoren.M[leeftijd] ?? null,
      meisjes: factoren.V[leeftijd] ?? null,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="leeftijd"
          fontSize={12}
          label={{ value: "Leeftijd", position: "insideBottom", offset: -5 }}
        />
        <YAxis
          fontSize={12}
          domain={[0.6, 1.2]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${(value * 100).toFixed(1)}%`,
            name === "jongens" ? "Jongens" : "Meisjes",
          ]}
          labelFormatter={(label: number) => `Overgang naar leeftijd ${label}`}
        />
        <Legend formatter={(value: string) => (value === "jongens" ? "Jongens" : "Meisjes")} />
        <ReferenceLine
          y={1}
          stroke="#9CA3AF"
          strokeDasharray="4 4"
          label={{ value: "100% = geen verloop", position: "right", fontSize: 11, fill: "#9CA3AF" }}
        />
        <Line
          type="monotone"
          dataKey="jongens"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="meisjes"
          stroke="#F472B6"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
