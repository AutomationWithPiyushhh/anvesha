export default function CourseDetailLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 animate-pulse">
      {/* Back button skeleton */}
      <div className="w-32 h-4 bg-slate-200/60 rounded mb-6" />

      {/* Hero skeleton */}
      <div className="glass-card rounded-3xl p-8 mb-10 h-72 bg-slate-200/40" />

      {/* Title skeleton */}
      <div className="w-48 h-6 bg-slate-200/70 rounded mb-6" />

      {/* Lessons skeleton */}
      <div className="space-y-3 max-w-4xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-4 rounded-2xl h-16 bg-slate-200/50 flex items-center justify-between" />
        ))}
      </div>
    </div>
  )
}
