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

interface InstroomUitstroomProps {
  data: { seizoen: string; seizoenVol: string; instroom: number; uitstroom: number }[];
}

export function InstroomUitstroom({ data }: InstroomUitstroomProps) {
  const router = useRouter();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
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
        <Legend />
        <Bar dataKey="instroom" fill="#4CAF50" name="Instroom" />
        <Bar dataKey="uitstroom" fill="#D62828" name="Uitstroom" />
      </BarChart>
    </ResponsiveContainer>
  );
}
