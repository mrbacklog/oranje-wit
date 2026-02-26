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

interface VerloopBarChartsProps {
  data: { leeftijd: number; M: number; V: number }[];
  type: "instroom" | "uitstroom";
}

export function VerloopBarCharts({ data, type }: VerloopBarChartsProps) {
  const colorM = type === "instroom" ? "#4CAF50" : "#D62828";
  const colorV = type === "instroom" ? "#81C784" : "#EF9A9A";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="leeftijd"
          fontSize={12}
          label={{ value: "Leeftijd", position: "insideBottom", offset: -5 }}
        />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="M" stackId="stack" fill={colorM} name="Jongens" />
        <Bar dataKey="V" stackId="stack" fill={colorV} name="Meisjes" />
      </BarChart>
    </ResponsiveContainer>
  );
}
