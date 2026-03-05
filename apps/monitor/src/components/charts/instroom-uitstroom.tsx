"use client";

import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface InstroomUitstroomProps {
  data: {
    seizoen: string;
    seizoenVol: string;
    isLopend?: boolean;
    instroom: number;
    uitstroom: number;
  }[];
}

export function InstroomUitstroom({ data }: InstroomUitstroomProps) {
  const router = useRouter();

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          className="cursor-pointer"
          onClick={(state) => {
            if (state?.activePayload?.[0]?.payload?.seizoenVol) {
              router.push(`/retentie/${state.activePayload[0].payload.seizoenVol}`);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="seizoen"
            fontSize={12}
            tickFormatter={(val, idx) => {
              const item = data[idx];
              return item?.isLopend ? `${val}*` : val;
            }}
          />
          <YAxis fontSize={12} />
          <Tooltip
            labelFormatter={(_label, payload) => {
              const item = payload?.[0]?.payload;
              const seizoen = item?.seizoenVol ?? _label;
              return item?.isLopend ? `${seizoen} (lopend \u2014 voorlopig)` : seizoen;
            }}
          />
          <Legend />
          <Bar dataKey="instroom" name="Instroom">
            {data.map((entry, index) => (
              <Cell
                key={`in-${index}`}
                fill={entry.isLopend ? "#4caf5088" : "#4caf50"}
                stroke={entry.isLopend ? "#4caf50" : undefined}
                strokeWidth={entry.isLopend ? 1 : 0}
              />
            ))}
          </Bar>
          <Bar dataKey="uitstroom" name="Uitstroom">
            {data.map((entry, index) => (
              <Cell
                key={`uit-${index}`}
                fill={entry.isLopend ? "#f4433688" : "#f44336"}
                stroke={entry.isLopend ? "#f44336" : undefined}
                strokeWidth={entry.isLopend ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.some((d) => d.isLopend) && (
        <p className="mt-1 text-xs text-gray-400">* Lopend seizoen \u2014 cijfers zijn voorlopig</p>
      )}
    </>
  );
}
