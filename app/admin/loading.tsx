export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-200 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-200" />
            </div>
            <div className="h-8 w-14 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-200 rounded" />
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="h-28 bg-slate-100 rounded-xl" />
          </div>
        </div>
        <div className="h-72 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
