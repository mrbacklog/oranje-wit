interface SignalBadgeProps {
  ernst: "kritiek" | "aandacht" | "opkoers";
  children: React.ReactNode;
}

export function SignalBadge({ ernst, children }: SignalBadgeProps) {
  const styles = {
    kritiek: "bg-red-100 text-red-800 border-red-200",
    aandacht: "bg-yellow-50 text-yellow-800 border-yellow-200",
    opkoers: "bg-green-50 text-green-800 border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[ernst]}`}
    >
      {children}
    </span>
  );
}
