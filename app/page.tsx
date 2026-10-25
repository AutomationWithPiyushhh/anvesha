import { Suspense } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Film,
  Laptop,
  Flame,
  ArrowRight,
  Code2,
  Terminal,
  Cpu,
  CheckCircle,
} from 'lucide-react'
import { getCurrentProfile } from '@/lib/auth/session'

async function AuthActionButtons() {
  let profile = null
  try {
    profile = await getCurrentProfile()
  } catch {
    profile = null
  }

  if (profile) {
    return (
      <Link
        href="/dashboard"
        className="btn-accent w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-md hover:shadow-xl"
      >
        <span>Go to My Courses</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/login"
        className="btn-accent w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-md hover:shadow-xl"
      >
        <span>Student Sign In</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
      <Link
        href="/signup"
        className="btn-glass w-full sm:w-auto px-6 py-3.5 text-base font-semibold"
      >
        Create Account
      </Link>
    </>
  )
}

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Soft Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#ffc107] rounded-full blur-[140px] opacity-15 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400 rounded-full blur-[120px] opacity-10 pointer-events-none" />

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto relative z-10">
          <div className="badge-accent mb-6 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Private Software Engineering Academy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Master Real-World <br />
            <span className="text-[#d97706] relative inline-block">
              Software Engineering
              <span className="absolute -bottom-1.5 left-0 w-full h-1 bg-[#ffc107] rounded-full" />
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            A high-performance, private video learning platform built exclusively for my students.
            Deep-dive modules into enterprise test automation, scalable backend architectures,
            and software engineering craft.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto min-h-[50px]">
            <Suspense fallback={
              <div className="w-48 h-12 bg-slate-200/60 rounded-xl animate-pulse" />
            }>
              <AuthActionButtons />
            </Suspense>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Private Student Access
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              HLS Secure Playback
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Real Engineering Code
            </span>
          </div>
        </div>
      </section>

      {/* Security & Experience Pillars */}
      <section className="py-12 sm:py-16 bg-white/50 border-y border-slate-200/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-wider text-[#d97706] mb-1">
              Platform Features
            </h2>
            <p className="text-2xl font-bold text-slate-900">
              Built for Focused, Uninterrupted Learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 sm:p-8 rounded-2xl">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#d97706] flex items-center justify-center mb-4">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                HLS Directory Token Security
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lectures are hosted privately on high-speed Bunny Stream edge servers with
                temporary signed tokens. No raw video files or public links are ever exposed.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#d97706] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Anti-Piracy Watermarking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic, anti-tamper email overlay drifts continuously across the player canvas
                to protect proprietary engineering course materials.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#d97706] flex items-center justify-center mb-4">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                2-Device Limit & Session Lock
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accounts are restricted to a maximum of 2 trusted devices with single concurrent
                playback enforced via live heartbeat synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Preview */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-xs uppercase font-bold tracking-wider text-[#d97706] mb-1">
              Curriculum Tracks
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              Software Engineering Masterclasses
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-700 hover:text-[#d97706] flex items-center gap-1"
          >
            <span>View Enrolled Tracks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-[#ffc107] flex items-center justify-center mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="badge-accent text-[10px] mb-2">Track 01</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Enterprise Test Automation
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                Playwright, Selenium WebDriver, Page Object Patterns, and resilient CI/CD pipelines.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Full Stack SDET</span>
              <span className="text-slate-900 font-bold">12 Modules</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-[#ffc107] flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="badge-accent text-[10px] mb-2">Track 02</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Distributed Systems & APIs
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                RESTful APIs, message brokers, caching architectures, and database scalability.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Backend Architecture</span>
              <span className="text-slate-900 font-bold">8 Modules</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-[#ffc107] flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="badge-accent text-[10px] mb-2">Track 03</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                High Performance Engineering
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                Concurrency, memory profiling, clean code architecture, and debugging at scale.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Core Engineering</span>
              <span className="text-slate-900 font-bold">10 Modules</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
