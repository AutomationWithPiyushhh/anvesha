export default function DashboardLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 animate-pulse">
      {/* Skeleton Banner */}
      <div className="glass-card p-8 rounded-3xl mb-10 h-44 bg-slate-200/50 flex flex-col justify-between" />

      {/* Skeleton Title */}
      <div className="w-56 h-6 bg-slate-200/60 rounded-lg mb-8" />

      {/* Skeleton Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl h-80 bg-slate-200/40 flex flex-col">
            <div className="aspect-video w-full bg-slate-200/70" />
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="w-3/4 h-5 bg-slate-200/80 rounded mb-3" />
                <div className="w-full h-3 bg-slate-200/60 rounded mb-2" />
                <div className="w-2/3 h-3 bg-slate-200/60 rounded" />
              </div>
              <div className="w-full h-2 bg-slate-200/70 rounded mt-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
