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
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

interface LedenTrendProps {
  data: { seizoen: string; seizoenVol: string; totaal: number }[];
}

interface LedenTrendDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: { seizoenVol?: string };
}

export function LedenTrend({ data }: LedenTrendProps) {
  const router = useRouter();
  const heeftLopend = data.some((d) => d.seizoenVol === HUIDIG_SEIZOEN);

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
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
              return item?.seizoenVol === HUIDIG_SEIZOEN ? `${val}*` : val;
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
              return item?.seizoenVol === HUIDIG_SEIZOEN ? `${seizoen} (nog lopend)` : seizoen;
            }}
          />
          <Line
            type="monotone"
            dataKey="totaal"
            stroke="var(--ow-oranje-600)"
            strokeWidth={2}
            dot={(props: LedenTrendDotProps) => {
              const { cx, cy, index, payload } = props;
              const isLopend = payload?.seizoenVol === HUIDIG_SEIZOEN;
              return (
                <circle
                  key={`ledentrend-dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={isLopend ? 5 : 3}
                  fill={isLopend ? "var(--surface-card)" : "var(--ow-oranje-600)"}
                  stroke="var(--ow-oranje-600)"
                  strokeWidth={isLopend ? 2 : 0}
                  strokeDasharray={isLopend ? "2 2" : undefined}
                />
              );
            }}
            activeDot={{ r: 6, cursor: "pointer" }}
          />
        </LineChart>
      </ResponsiveContainer>
      {heeftLopend && (
        <p className="text-text-muted mt-1 text-xs">* Lopend seizoen — gemeten op veld_najaar</p>
      )}
    </>
  );
}
