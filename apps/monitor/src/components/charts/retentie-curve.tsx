"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RetentieCurveProps {
  data: {
    leeftijd: number;
    retentie: number;
    retentie_m?: number;
    retentie_v?: number;
  }[];
  toonMV?: boolean;
}

export function RetentieCurve({ data, toonMV = false }: RetentieCurveProps) {
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
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, ""]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="retentie"
          stroke="#FF6B00"
          strokeWidth={2}
          name="Totaal"
          dot={{ fill: "#FF6B00", r: 3 }}
        />
        {toonMV && (
          <>
            <Line
              type="monotone"
              dataKey="retentie_m"
              stroke="#4A90D9"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              name="Jongens"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="retentie_v"
              stroke="#D62828"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              name="Meisjes"
              dot={false}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
