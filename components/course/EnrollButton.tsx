'use client'

import { useState } from 'react'
import { EnrollmentCheckoutModal } from '@/components/course/EnrollmentCheckoutModal'
import { CreditCard, Clock, CheckCircle2 } from 'lucide-react'

interface EnrollButtonProps {
  courseId: string
  courseTitle: string
  priceInr?: number
  hasPendingRequest?: boolean
  className?: string
}

export function EnrollButton({
  courseId,
  courseTitle,
  priceInr = 4999,
  hasPendingRequest = false,
  className = '',
}: EnrollButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (hasPendingRequest) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold">
        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
        <span>Enrollment Request Pending Review</span>
      </div>
    )
  }

  const priceLabel = priceInr > 0 ? `₹${priceInr.toLocaleString('en-IN')}` : 'Free'

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md hover:shadow-lg transition-all ${className}`}
      >
        <CreditCard className="w-4 h-4 text-slate-900" />
        <span>Enroll & Unlock ({priceLabel})</span>
      </button>

      <EnrollmentCheckoutModal
        courseId={courseId}
        courseTitle={courseTitle}
        priceInr={priceInr}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
