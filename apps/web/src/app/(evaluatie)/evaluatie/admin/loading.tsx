export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="border-border-default border-t-ow-oranje h-8 w-8 animate-spin rounded-full border-2" />
        <p className="text-text-muted text-sm">Laden...</p>
      </div>
    </div>
  );
}
