import { PageContainer } from "@oranje-wit/ui";

export default function Loading() {
  return (
    <PageContainer>
      <div className="animate-pulse space-y-4">
        <div className="bg-surface-sunken h-4 w-32 rounded" />
        <div className="bg-surface-sunken h-8 w-64 rounded" />
        <div className="bg-surface-sunken h-96 rounded-xl" />
      </div>
    </PageContainer>
  );
}
