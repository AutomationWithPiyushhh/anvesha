'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Printer, Share2, Check, ArrowLeft } from 'lucide-react'

export function CertificateControls({ courseId }: { courseId: string }) {
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignored
    }
  }

  return (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto w-full mb-8 px-4">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course</span>
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share Credential</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Download PDF</span>
        </button>
      </div>
    </div>
  )
}
