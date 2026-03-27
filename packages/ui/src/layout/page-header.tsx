import { InfoButton } from "../feedback/info-button";

export function PageHeader({
  title,
  subtitle,
  onInfoClick,
  actions,
}: {
  title: string;
  subtitle: string;
  onInfoClick?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          {onInfoClick && <InfoButton onClick={onInfoClick} />}
        </div>
        {actions}
      </div>
      <p className="mt-1" style={{ color: "var(--text-tertiary)" }}>
        {subtitle}
      </p>
    </div>
  );
}
