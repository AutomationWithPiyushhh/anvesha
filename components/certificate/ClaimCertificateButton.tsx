'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { claimCertificateAction } from '@/lib/certificates/actions'
import { Award, Loader2, CheckCircle2 } from 'lucide-react'

export function ClaimCertificateButton({
  courseId,
  existingCertId,
}: {
  courseId: string
  existingCertId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClaim = async () => {
    if (existingCertId) {
      router.push(`/certificates/${existingCertId}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await claimCertificateAction(courseId)
      if (res.success && res.certificate) {
        router.push(`/certificates/${res.certificate.id}`)
      } else {
        setError(res.error || 'Failed to generate certificate')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error generating certificate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
        ) : (
          <Award className="w-4 h-4 text-slate-900" />
        )}
        <span>
          {existingCertId ? 'View Verified Certificate' : 'Claim Completion Certificate'}
        </span>
      </button>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  )
}
