import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'
import { Navbar, NavbarSkeleton } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ANVESHA | Private Software Engineering Video Platform',
  description:
    'Dedicated private video-course portal for software engineering students. High-security HLS video streaming, progress tracking, and structured engineering curriculum.',
  keywords: ['software engineering', 'private video course', 'anvesha', 'learning platform'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col text-slate-900 bg-[#f8fafc]">
        <Suspense fallback={<NavbarSkeleton />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
