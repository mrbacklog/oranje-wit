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

interface InstroomUitstroomProps {
  data: { seizoen: string; instroom: number; uitstroom: number }[];
}

export function InstroomUitstroom({ data }: InstroomUitstroomProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
