"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CohortRetentieRij {
  instroomSeizoen: string;
  cohortGrootte: number;
  retentie: { jarenNaInstroom: number; actief: number; percentage: number }[];
}

interface CohortRetentieCurvenProps {
  data: CohortRetentieRij[];
  maxCohorten?: number;
}

const KLEUREN = [
  "#3B82F6",
  "#EC4899",
  "#FF6B00",
  "#22C55E",
  "#8B5CF6",
  "#06B6D4",
  "#F59E0B",
  "#EF4444",
];

function formatSeizoen(seizoen: string): string {
  const parts = seizoen.split("-");
  if (parts.length === 2) {
    return `${parts[0].slice(2)}/${parts[1].slice(2)}`;
  }
  return seizoen;
}

export function CohortRetentieCurven({ data, maxCohorten = 6 }: CohortRetentieCurvenProps) {
  // Neem de laatste N cohorten (meest recent)
  const sorted = [...data].sort((a, b) => b.instroomSeizoen.localeCompare(a.instroomSeizoen));
  const cohorten = sorted.slice(0, maxCohorten).reverse();

  // Bepaal maximaal aantal jaren
  const maxJaren = Math.max(
    ...cohorten.map((c) => Math.max(0, ...c.retentie.map((r) => r.jarenNaInstroom)))
  );

  // Transformeer naar Recharts-formaat
  const chartData: Record<string, number | string>[] = [];
  for (let j = 0; j <= maxJaren; j++) {
    const punt: Record<string, number | string> = { jarenNaInstroom: j };
    for (const cohort of cohorten) {
      const key = formatSeizoen(cohort.instroomSeizoen);
      if (j === 0) {
        punt[key] = 100;
      } else {
        const match = cohort.retentie.find((r) => r.jarenNaInstroom === j);
        if (match) {
          punt[key] = Math.round(match.percentage * 10) / 10;
        }
      }
    }
    chartData.push(punt);
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis
          dataKey="jarenNaInstroom"
          fontSize={12}
          tick={{ fill: "var(--text-tertiary)" }}
          label={{
            value: "Jaren na instroom",
            position: "insideBottom",
            offset: -5,
            fill: "var(--text-tertiary)",
          }}
          tickFormatter={(v: number) => `Jaar ${v}`}
        />
        <YAxis
          fontSize={12}
          domain={[0, 100]}
          tick={{ fill: "var(--text-tertiary)" }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
          formatter={(v: number) => [`${v.toFixed(1)}%`, ""]}
        />
        <Legend wrapperStyle={{ color: "var(--text-secondary)" }} />
        {cohorten.map((cohort, i) => (
          <Line
            key={cohort.instroomSeizoen}
            type="monotone"
            dataKey={formatSeizoen(cohort.instroomSeizoen)}
            stroke={KLEUREN[i % KLEUREN.length]}
            strokeWidth={2}
            dot={{ fill: KLEUREN[i % KLEUREN.length], r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
