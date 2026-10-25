export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-[#ffc107]/20 border border-[#ffc107]/40 flex items-center justify-center animate-pulse">
            <span className="font-bold text-xl text-slate-900">A</span>
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ffc107] animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-slate-800">Loading ANVESHA...</p>
          <p className="text-xs text-slate-500">Preparing your private engineering workspace</p>
        </div>
      </div>
    </div>
  )
}
