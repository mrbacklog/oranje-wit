"use client";

import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LedenTrendProps {
  data: { seizoen: string; seizoenVol: string; totaal: number }[];
}

export function LedenTrend({ data }: LedenTrendProps) {
  const router = useRouter();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        className="cursor-pointer"
        onClick={(state) => {
          if (state?.activePayload?.[0]?.payload?.seizoenVol) {
            router.push(`/retentie/${state.activePayload[0].payload.seizoenVol}`);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis dataKey="seizoen" fontSize={12} tick={{ fill: "var(--text-tertiary)" }} />
        <YAxis fontSize={12} tick={{ fill: "var(--text-tertiary)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <Line
          type="monotone"
          dataKey="totaal"
          stroke="var(--ow-oranje-600)"
          strokeWidth={2}
          dot={{ fill: "var(--ow-oranje-600)" }}
          activeDot={{ r: 6, cursor: "pointer" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
