"use client";

import { useRouter } from "next/navigation";
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

interface LedenboogProps {
  data: { geboortejaar: number; M: number; V: number; band: string }[];
  seizoen?: string;
}

export function Ledenboog({ data, seizoen }: LedenboogProps) {
  const router = useRouter();

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
      <BarChart
        data={chartData}
        layout="vertical"
        stackOffset="sign"
        className={seizoen ? "cursor-pointer" : ""}
        onClick={(state) => {
          if (seizoen && state?.activeLabel) {
            router.push(`/samenstelling/${state.activeLabel}?seizoen=${seizoen}`);
          }
        }}
      >
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
            name === "M" ? "\u2642 Jongens" : "\u2640 Meisjes",
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "M" ? "\u2642 Jongens" : "\u2640 Meisjes"
          }
        />
        <ReferenceLine x={0} stroke="#666" />
        <Bar dataKey="M" stackId="stack" name="M" fill="#60A5FA" />
        <Bar dataKey="V" stackId="stack" name="V" fill="#F472B6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
