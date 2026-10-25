'use client'

import { Shield, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/40 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-6 h-6 rounded-md bg-[#ffc107] text-black text-xs font-bold flex items-center justify-center">
            A
          </div>
          <span>
            © 2026 <strong>ANVESHA</strong>. Private Software Engineering Platform.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#f59e0b]" /> Protected HLS Streaming
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" /> Dynamic Watermark
          </span>
        </div>
      </div>
    </footer>
  )
}
