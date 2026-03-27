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
  Cell,
} from "recharts";

interface SeizoenBarChartProps {
  data: { seizoen: string; seizoenKort: string; isLopend?: boolean; M: number; V: number }[];
  kleurM?: string;
  kleurV?: string;
}

export function SeizoenBarChart({
  data,
  kleurM = "#3B82F6",
  kleurV = "#EC4899",
}: SeizoenBarChartProps) {
  const router = useRouter();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        barGap={2}
        className="cursor-pointer"
        onClick={(state) => {
          if (state?.activePayload?.[0]?.payload?.seizoen) {
            router.push(`/retentie/${state.activePayload[0].payload.seizoen}`);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis
          dataKey="seizoenKort"
          fontSize={12}
          tick={{ fill: "var(--text-tertiary)" }}
          tickFormatter={(val, idx) => {
            const item = data[idx];
            return item?.isLopend ? `${val}*` : val;
          }}
        />
        <YAxis fontSize={12} tick={{ fill: "var(--text-tertiary)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
          labelFormatter={(_label, payload) => {
            const item = payload?.[0]?.payload;
            const seizoen = item?.seizoen ?? _label;
            return item?.isLopend ? `${seizoen} (lopend — voorlopig)` : seizoen;
          }}
        />
        <Legend wrapperStyle={{ color: "var(--text-secondary)" }} />
        <Bar dataKey="M" name="Jongens" barSize={12}>
          {data.map((entry, index) => (
            <Cell
              key={`M-${index}`}
              fill={entry.isLopend ? `${kleurM}88` : kleurM}
              stroke={entry.isLopend ? kleurM : undefined}
              strokeWidth={entry.isLopend ? 1 : 0}
              strokeDasharray={entry.isLopend ? "4 2" : undefined}
            />
          ))}
        </Bar>
        <Bar dataKey="V" name="Meisjes" barSize={12}>
          {data.map((entry, index) => (
            <Cell
              key={`V-${index}`}
              fill={entry.isLopend ? `${kleurV}88` : kleurV}
              stroke={entry.isLopend ? kleurV : undefined}
              strokeWidth={entry.isLopend ? 1 : 0}
              strokeDasharray={entry.isLopend ? "4 2" : undefined}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
