interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  className?: string
  height?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({
  percentage,
  showLabel = true,
  className = '',
  height = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage))

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
          <span>Course Completion</span>
          <span className="text-[#d97706]">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200/80 rounded-full overflow-hidden ${heightClasses[height]} shadow-inner`}>
        <div
          className="h-full bg-gradient-to-r from-[#ffc107] to-[#f59e0b] rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
