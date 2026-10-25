import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCertificateById } from '@/lib/certificates/actions'
import { CertificateControls } from '@/components/certificate/CertificateControls'
import { Award, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react'

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cert = await getCertificateById(id)

  if (!cert) {
    notFound()
  }

  const issueDateFormatted = new Date(cert.issued_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-100/60 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white flex flex-col items-center justify-center">
      {/* Controls Bar (Hidden in Print) */}
      <CertificateControls courseId={cert.course_id} />

      {/* Main Certificate Sheet */}
      <div className="w-full max-w-4xl bg-white rounded-3xl p-8 sm:p-14 lg:p-16 border-8 border-[#f59e0b]/20 shadow-2xl relative overflow-hidden print:border-4 print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-10">
        {/* Subtle Background Radial Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Inner Gold Inset Frame */}
        <div className="relative border-2 border-amber-400/80 rounded-2xl p-6 sm:p-10 text-center flex flex-col items-center">
          {/* Top Corner Ornaments */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

          {/* ANVESHA Header & Emblem */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl sm:text-2xl font-serif font-extrabold tracking-widest text-slate-900">
              ANVESHA
            </span>
          </div>

          <p className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.25em] text-amber-700 mb-6 sm:mb-8">
            Academy of Advanced Software Engineering
          </p>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-4">
            Certificate of Completion
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 italic mb-6">
            This credential formally attests that
          </p>

          {/* Student Name */}
          <div className="relative py-2 px-8 mb-6 border-b-2 border-slate-900 inline-block">
            <h2 className="text-2xl sm:text-4xl font-serif font-extrabold text-slate-900 tracking-wide">
              {cert.student_name}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed mb-6">
            has rigorously studied, completed all curriculum coursework, and demonstrated verified technical competency in:
          </p>

          {/* Course Title */}
          <div className="bg-amber-500/10 border border-amber-400/50 rounded-2xl py-3 px-6 mb-8 max-w-xl w-full">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {cert.course_title}
            </h3>
          </div>

          {/* Verification & Signatures Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-8 border-t border-slate-200 text-left">
            {/* Issue Date */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Date Issued
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {issueDateFormatted}
              </p>
            </div>

            {/* Official Gold Seal Badge */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-100 to-amber-200 flex flex-col items-center justify-center text-amber-800 shadow-inner">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 mb-0.5" />
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-900">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Credential ID */}
            <div className="sm:text-right">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Credential ID
              </p>
              <p className="text-xs sm:text-sm font-mono font-bold text-amber-700">
                {cert.certificate_number}
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Digitally Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
