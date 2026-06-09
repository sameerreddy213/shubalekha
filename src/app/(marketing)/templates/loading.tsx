export default function TemplatesLoading() {
  return (
    <div className="container py-12">
      {/* Hero skeleton */}
      <div className="max-w-2xl space-y-3 pb-10 pt-6">
        <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      {/* Grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
