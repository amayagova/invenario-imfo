'use client';

export function PageHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}
