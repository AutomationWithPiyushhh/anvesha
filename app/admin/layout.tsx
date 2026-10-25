import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/session'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Admin Pill */}
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="font-serif font-black tracking-widest text-xl text-slate-900">
                  ANVESHA
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Admin Console
                </span>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-slate-200 pl-6">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  Overview
                </Link>
                <Link
                  href="/admin/courses"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  Courses & Lessons
                </Link>
                <Link
                  href="/admin/students"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  Students & Devices
                </Link>
                <Link
                  href="/admin/requests"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Enrollment Requests
                </Link>
              </nav>
            </div>

            {/* Right: Exit to Student Portal */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-slate-600">
                Logged in as <strong className="text-slate-900">{profile.email}</strong>
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Student Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-4 py-2 bg-slate-50/50">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Overview
          </Link>
          <Link
            href="/admin/courses"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Courses
          </Link>
          <Link
            href="/admin/students"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <Users className="w-3.5 h-3.5" />
            Students
          </Link>
          <Link
            href="/admin/requests"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Requests
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
