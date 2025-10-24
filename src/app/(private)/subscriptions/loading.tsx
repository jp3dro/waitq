export default function Loading() {
  return (
    <main className="py-5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="h-8 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-80 bg-muted rounded mt-2 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-8 w-24 bg-muted rounded mt-4 animate-pulse" />
              <div className="space-y-2 mt-4">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-10 w-full bg-muted rounded mt-6 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
            <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx}>
                  <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card text-card-foreground ring-1 ring-border rounded-xl p-6">
            <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
            <div className="h-24 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}


