import type { ValidatieStatus } from "@/lib/validatie/regels";

const STATUS_KLEUREN: Record<ValidatieStatus, string> = {
  GROEN: "bg-green-500",
  ORANJE: "bg-orange-400",
  ROOD: "bg-red-500",
};

const STATUS_LABELS: Record<ValidatieStatus, string> = {
  GROEN: "Geen problemen",
  ORANJE: "Aandachtspunten",
  ROOD: "Kritieke meldingen",
};

interface ValidatieBadgeProps {
  status: ValidatieStatus;
  size?: "sm" | "md";
  onClick?: () => void;
}

export default function ValidatieBadge({
  status,
  size = "sm",
  onClick,
}: ValidatieBadgeProps) {
  const px = size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

  return (
    <button
      type="button"
      onClick={onClick}
      title={STATUS_LABELS[status]}
      className={`${px} rounded-full ${STATUS_KLEUREN[status]} shrink-0 inline-block cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-shadow`}
    />
  );
}
