import { InfoButton } from "./info-button";

export function PageHeader({
  title,
  subtitle,
  onInfoClick,
}: {
  title: string;
  subtitle: string;
  onInfoClick?: () => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {onInfoClick && <InfoButton onClick={onInfoClick} />}
      </div>
      <p className="mt-1 text-gray-500">{subtitle}</p>
    </div>
  );
}
