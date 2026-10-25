export default function WatchLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="w-64 h-4 bg-slate-200/60 rounded mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Player skeleton */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="aspect-video w-full rounded-3xl bg-slate-900/90 shadow-2xl flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[#ffc107] animate-spin" />
          </div>
          <div className="glass-card p-6 rounded-3xl h-24 bg-slate-200/40" />
        </div>

        {/* Right Sidebar skeleton */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 h-[70vh] bg-slate-200/40 flex flex-col justify-between">
          <div>
            <div className="w-24 h-3 bg-slate-200/70 rounded mb-2" />
            <div className="w-48 h-5 bg-slate-200/80 rounded mb-4" />
            <div className="w-full h-2 bg-slate-200/70 rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-slate-200/50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
