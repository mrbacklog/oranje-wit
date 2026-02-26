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

interface ProjectieBoogProps {
  data: {
    leeftijd: number;
    band: string;
    huidig: number;
    streef: number;
  }[];
}

export function ProjectieBoog({ data }: ProjectieBoogProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
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
        <Bar dataKey="huidig" fill="#FF6B00" name="Huidig" />
        <Bar dataKey="streef" fill="#4A90D9" name="Streef" fillOpacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  );
}
