export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#ff6b00]" />
        <p className="text-sm text-gray-500">Laden...</p>
      </div>
    </div>
  );
}
