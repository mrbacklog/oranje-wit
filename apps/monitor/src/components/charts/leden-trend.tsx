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
            router.push(`/verloop/${state.activePayload[0].payload.seizoenVol}`);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="seizoen" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="totaal"
          stroke="#ff6b00"
          strokeWidth={2}
          dot={{ fill: "#ff6b00" }}
          activeDot={{ r: 6, cursor: "pointer" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
