interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  signal?: "groen" | "geel" | "rood";
}

export function KpiCard({ label, value, trend, signal }: KpiCardProps) {
  const signalColor =
    signal === "rood"
      ? "text-signal-rood"
      : signal === "geel"
        ? "text-signal-geel"
        : signal === "groen"
          ? "text-signal-groen"
          : "text-ow-oranje";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${signalColor}`}>{value}</p>
      {trend && (
        <p
          className={`mt-1 text-sm ${trend.value >= 0 ? "text-signal-groen" : "text-signal-rood"}`}
        >
          {trend.value >= 0 ? "+" : ""}
          {trend.value} {trend.label}
        </p>
      )}
    </div>
  );
}
