export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-gray-500">{subtitle}</p>
    </div>
  );
}
