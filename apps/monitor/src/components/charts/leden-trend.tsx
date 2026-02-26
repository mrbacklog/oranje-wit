"use client";

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
  data: { seizoen: string; totaal: number }[];
}

export function LedenTrend({ data }: LedenTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="seizoen" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="totaal"
          stroke="#FF6B00"
          strokeWidth={2}
          dot={{ fill: "#FF6B00" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
