export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
