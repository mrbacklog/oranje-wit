"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface WaterfallItem {
  label: string;
  waarde: number;
  type: "start" | "instroom" | "uitstroom" | "eind";
}

interface WaterfallChartProps {
  data: WaterfallItem[];
}

const COLORS: Record<WaterfallItem["type"], string> = {
  start: "#6B7280",
  instroom: "#22C55E",
  uitstroom: "#EF4444",
  eind: "#6B7280",
};

interface TransformedItem {
  label: string;
  base: number;
  value: number;
  displayValue: string;
  type: WaterfallItem["type"];
}

function transformData(data: WaterfallItem[]): TransformedItem[] {
  let runningTotal = 0;
  return data.map((item) => {
    if (item.type === "start") {
      runningTotal = item.waarde;
      return {
        label: item.label,
        base: 0,
        value: item.waarde,
        displayValue: String(item.waarde),
        type: item.type,
      };
    }
    if (item.type === "eind") {
      return {
        label: item.label,
        base: 0,
        value: item.waarde,
        displayValue: String(item.waarde),
        type: item.type,
      };
    }
    if (item.type === "instroom") {
      const base = runningTotal;
      runningTotal += item.waarde;
      return {
        label: item.label,
        base,
        value: item.waarde,
        displayValue: `+${item.waarde}`,
        type: item.type,
      };
    }
    // uitstroom: waarde is negative
    runningTotal += item.waarde;
    return {
      label: item.label,
      base: runningTotal,
      value: Math.abs(item.waarde),
      displayValue: String(item.waarde),
      type: item.type,
    };
  });
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const transformed = transformData(data);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={transformed} layout="vertical" barSize={28}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" fontSize={12} />
        <YAxis type="category" dataKey="label" fontSize={12} width={80} />
        <Tooltip
          formatter={(_val: unknown, name: unknown, props: { payload?: TransformedItem }) => {
            if (name === "base") return [null, null];
            return [props.payload?.displayValue, props.payload?.label];
          }}
          labelFormatter={() => ""}
        />
        <Bar dataKey="base" stackId="stack" fill="transparent" isAnimationActive={false}>
          <LabelList content={() => null} />
        </Bar>
        <Bar dataKey="value" stackId="stack" isAnimationActive={false}>
          {transformed.map((entry, index) => (
            <Cell key={index} fill={COLORS[entry.type]} />
          ))}
          <LabelList
            dataKey="displayValue"
            position="right"
            fontSize={12}
            fontWeight={600}
            fill="#374151"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
