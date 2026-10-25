import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/session'
import { LogOut, Shield, BookOpen, User, LogIn } from 'lucide-react'

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ffc107] text-black font-extrabold flex items-center justify-center text-lg shadow-sm">
            A
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">ANVESHA</span>
        </Link>
        <div className="w-24 h-8 bg-slate-200/60 rounded-xl animate-pulse" />
      </div>
    </header>
  )
}

export async function Navbar() {
  let profile = null
  try {
    profile = await getCurrentProfile()
  } catch {
    profile = null
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#ffc107] text-black font-extrabold flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
              ANVESHA
              <span className="w-2 h-2 rounded-full bg-[#ffc107] animate-pulse" />
            </span>
            <span className="text-[10px] tracking-wider text-slate-500 uppercase font-medium">
              Software Engineering
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-3">
          {profile ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-black/5 rounded-lg transition-colors"
              >
                <BookOpen className="w-4 h-4 text-[#d97706]" />
                <span className="hidden sm:inline">My Courses</span>
              </Link>

              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-black bg-[#ffc107]/20 border border-[#ffc107]/50 hover:bg-[#ffc107]/30 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#d97706]" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User greeting */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {profile.name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {profile.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>

                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-glass text-xs font-medium px-4 py-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
              <Link
                href="/signup"
                className="btn-accent text-xs px-4 py-2"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
