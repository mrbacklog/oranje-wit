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
  ReferenceLine,
} from "recharts";

interface ProjectiePiramideProps {
  data: {
    leeftijd: number;
    band: string;
    huidige_m: number;
    huidige_v: number;
    streef_m: number;
    streef_v: number;
  }[];
}

export function ProjectiePiramide({ data }: ProjectiePiramideProps) {
  // Transform: M naar links (negatief), V naar rechts (positief)
  const chartData = data.map((d) => ({
    leeftijd: d.leeftijd,
    band: d.band,
    huidig_m: -d.huidige_m,
    huidig_v: d.huidige_v,
    streef_m: -d.streef_m,
    streef_v: d.streef_v,
  }));

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.huidige_m, d.huidige_v, d.streef_m, d.streef_v)),
    1
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 28)}>
      <BarChart data={chartData} layout="vertical" stackOffset="sign">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[-maxVal - 2, maxVal + 2]}
          fontSize={12}
          tickFormatter={(v: number) => String(Math.abs(v))}
        />
        <YAxis dataKey="leeftijd" type="category" fontSize={11} width={35} reversed />
        <Tooltip
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              streef_m: "Streef ♂",
              streef_v: "Streef ♀",
              huidig_m: "Huidig ♂",
              huidig_v: "Huidig ♀",
            };
            return [Math.abs(value), labels[name] || name];
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              streef_m: "Streef ♂",
              streef_v: "Streef ♀",
              huidig_m: "Huidig ♂",
              huidig_v: "Huidig ♀",
            };
            return labels[value] || value;
          }}
        />
        <ReferenceLine x={0} stroke="#666" />
        {/* Streef als achtergrond (semi-transparant) */}
        <Bar
          dataKey="streef_m"
          name="streef_m"
          fill="#60A5FA"
          fillOpacity={0.25}
          stackId="streef"
        />
        <Bar
          dataKey="streef_v"
          name="streef_v"
          fill="#F472B6"
          fillOpacity={0.25}
          stackId="streef"
        />
        {/* Huidig als voorgrond (solid) */}
        <Bar dataKey="huidig_m" name="huidig_m" fill="#60A5FA" stackId="huidig" />
        <Bar dataKey="huidig_v" name="huidig_v" fill="#F472B6" stackId="huidig" />
      </BarChart>
    </ResponsiveContainer>
  );
}
