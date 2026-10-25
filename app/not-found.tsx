import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#ffc107]/20 border border-[#ffc107]/40 flex items-center justify-center text-slate-900 mb-4 font-bold text-lg">
          <FileQuestion className="w-7 h-7 text-[#d97706]" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-600 mb-6">
          The course, video, or page you requested does not exist or you might not have access to it.
        </p>

        <Link
          href="/"
          className="btn-accent text-sm w-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
