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
} from "recharts";

interface SeizoenBarChartProps {
  data: { seizoen: string; seizoenKort: string; M: number; V: number }[];
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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="seizoenKort" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip
          labelFormatter={(_label, payload) => {
            const item = payload?.[0]?.payload;
            return item?.seizoen ?? _label;
          }}
        />
        <Legend />
        <Bar dataKey="M" fill={kleurM} name="Jongens" barSize={12} />
        <Bar dataKey="V" fill={kleurV} name="Meisjes" barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
