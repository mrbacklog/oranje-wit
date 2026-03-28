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
import { colors } from "@oranje-wit/ui/tokens/colors";

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
              router.push(`/monitor/retentie/${state.activePayload[0].payload.seizoenVol}`);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="seizoen"
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
              const seizoen = item?.seizoenVol ?? _label;
              return item?.isLopend ? `${seizoen} (lopend \u2014 voorlopig)` : seizoen;
            }}
          />
          <Legend wrapperStyle={{ color: "var(--text-secondary)" }} />
          <Bar dataKey="instroom" name="Instroom">
            {data.map((entry, index) => (
              <Cell
                key={`in-${index}`}
                fill={entry.isLopend ? `${colors.semantic.success}88` : colors.semantic.success}
                stroke={entry.isLopend ? colors.semantic.success : undefined}
                strokeWidth={entry.isLopend ? 1 : 0}
              />
            ))}
          </Bar>
          <Bar dataKey="uitstroom" name="Uitstroom">
            {data.map((entry, index) => (
              <Cell
                key={`uit-${index}`}
                fill={entry.isLopend ? `${colors.semantic.error}88` : colors.semantic.error}
                stroke={entry.isLopend ? colors.semantic.error : undefined}
                strokeWidth={entry.isLopend ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.some((d) => d.isLopend) && (
        <p className="text-text-muted mt-1 text-xs">
          * Lopend seizoen \u2014 cijfers zijn voorlopig
        </p>
      )}
    </>
  );
}
