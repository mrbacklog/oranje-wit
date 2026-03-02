"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GroupedBarChartProps {
  data: { leeftijd: number; M: number; V: number }[];
  kleurM?: string;
  kleurV?: string;
  xLabel?: string;
}

export function GroupedBarChart({
  data,
  kleurM = "#3B82F6",
  kleurV = "#EC4899",
  xLabel = "Leeftijd",
}: GroupedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="leeftijd"
          fontSize={12}
          label={{ value: xLabel, position: "insideBottom", offset: -5 }}
        />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="M" fill={kleurM} name="Jongens" barSize={8} />
        <Bar dataKey="V" fill={kleurV} name="Meisjes" barSize={8} />
      </BarChart>
    </ResponsiveContainer>
  );
}
