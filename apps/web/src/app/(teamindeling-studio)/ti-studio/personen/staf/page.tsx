import { EmptyState } from "@oranje-wit/ui";

export default function PersonenStafPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Staf
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Trainers en coaches toewijzen aan teams
        </p>
      </div>

      <EmptyState
        title="Staf-module"
        description="De staf-module komt in een volgende fase. Hier kun je straks coaches en trainers toewijzen aan teams."
      />
    </div>
  );
}
