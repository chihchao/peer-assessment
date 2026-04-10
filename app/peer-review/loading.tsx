export default function Loading() {
  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
        <div className="grid gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
