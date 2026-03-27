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
import { colors } from "@oranje-wit/ui/tokens/colors";

interface RetentieCurveProps {
  data: {
    leeftijd: number;
    retentie: number;
    retentie_m?: number;
    retentie_v?: number;
  }[];
  toonMV?: boolean;
}

export function RetentieCurve({ data, toonMV = true }: RetentieCurveProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis
          dataKey="leeftijd"
          fontSize={12}
          tick={{ fill: "var(--text-tertiary)" }}
          label={{
            value: "Leeftijd",
            position: "insideBottom",
            offset: -5,
            fill: "var(--text-tertiary)",
          }}
        />
        <YAxis
          fontSize={12}
          domain={[0, 100]}
          tick={{ fill: "var(--text-tertiary)" }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, ""]}
        />
        <Legend wrapperStyle={{ color: "var(--text-secondary)" }} />
        <Line
          type="monotone"
          dataKey="retentie"
          stroke="var(--ow-oranje-500)"
          strokeWidth={2}
          name="Totaal"
          dot={{ fill: "var(--ow-oranje-500)", r: 3 }}
        />
        {toonMV && (
          <>
            <Line
              type="monotone"
              dataKey="retentie_m"
              stroke={colors.gender.m}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              name="Jongens"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="retentie_v"
              stroke={colors.gender.v}
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
