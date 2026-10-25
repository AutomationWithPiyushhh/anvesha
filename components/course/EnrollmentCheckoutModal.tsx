'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  submitEnrollmentRequestAction,
  enrollFreeCourseAction,
} from '@/lib/enrollment/actions'
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Gift,
} from 'lucide-react'

declare global {
  interface Window {
    Razorpay?: unknown
  }
}

interface EnrollmentCheckoutModalProps {
  courseId: string
  courseTitle: string
  priceInr?: number
  isOpen: boolean
  onClose: () => void
}

export function EnrollmentCheckoutModal({
  courseId,
  courseTitle,
  priceInr = 0,
  isOpen,
  onClose,
}: EnrollmentCheckoutModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const isFree = !priceInr || priceInr <= 0

  // If free, we don't need payment tabs
  const [tab, setTab] = useState<'upi' | 'razorpay'>('razorpay')

  // Free enrollment state
  const [enrollingFree, setEnrollingFree] = useState(false)
  const [freeSuccess, setFreeSuccess] = useState(false)
  const [freeError, setFreeError] = useState<string | null>(null)

  // Razorpay state
  const [payingOnline, setPayingOnline] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // UPI / Request state
  const [utrNumber, setUtrNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submittingReq, setSubmittingReq] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key & lock body scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  // 1. Handle Free Instant Enrollment
  const handleFreeEnroll = async () => {
    setEnrollingFree(true)
    setFreeError(null)

    try {
      const res = await enrollFreeCourseAction(courseId)
      if (!res.success) {
        setFreeError(res.error || 'Failed to enroll in free course')
      } else {
        setFreeSuccess(true)
        setTimeout(() => {
          onClose()
          router.refresh()
        }, 1500)
      }
    } catch (err: unknown) {
      setFreeError(err instanceof Error ? err.message : 'Error enrolling in course')
    } finally {
      setEnrollingFree(false)
    }
  }

  // 2. Handle Online Razorpay Payment
  const handleRazorpayPayment = async () => {
    setPayingOnline(true)
    setPaymentError(null)

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })

      const data = await res.json()

      if (!res.ok || !data.configured) {
        setPaymentError(
          data.error ||
            'Razorpay gateway is not configured yet. Please use the Manual UPI / Request Access tab.'
        )
        setTab('upi')
        setPayingOnline(false)
        return
      }

      // Load Razorpay SDK script dynamically if needed
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
          document.body.appendChild(script)
        })
      }

      interface RazorpayResponse {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }

      interface RazorpayInstance {
        open: () => void
        on: (event: string, handler: (resp: { error?: { description?: string } }) => void) => void
      }

      type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance
      const RazorpayClass = window.Razorpay as RazorpayConstructor

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ANVESHA Engineering',
        description: `Enrollment: ${data.courseTitle}`,
        order_id: data.orderId,
        prefill: {
          name: data.userName,
          email: data.userEmail,
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                courseId,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.success) {
              onClose()
              router.refresh()
            } else {
              setPaymentError(verifyData.error || 'Payment verification failed.')
            }
          } catch {
            setPaymentError('Failed to verify payment with server.')
          }
        },
        modal: {
          ondismiss: () => {
            setPayingOnline(false)
          },
        },
      }

      const rzp = new RazorpayClass(options)
      rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
        setPaymentError(resp.error?.description || 'Payment was cancelled or failed.')
      })
      rzp.open()
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Payment initialization failed')
    } finally {
      setPayingOnline(false)
    }
  }

  // 3. Handle Manual UPI / Request Access
  const handleManualRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingReq(true)
    setRequestError(null)

    try {
      const res = await submitEnrollmentRequestAction({
        courseId,
        paymentMethod: 'manual_upi',
        transactionRef: utrNumber,
        notes,
      })

      if (!res.success) {
        setRequestError(res.error || 'Failed to submit request')
      } else {
        setRequestSuccess(true)
        setTimeout(() => {
          onClose()
          router.refresh()
        }, 2200)
      }
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : 'Error submitting request')
    } finally {
      setSubmittingReq(false)
    }
  }

  const formattedPrice = !isFree ? `₹${priceInr.toLocaleString('en-IN')}` : 'Free'

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-accent text-[11px]">
                {isFree ? 'Free Enrollment' : 'Enrollment Checkout'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                {formattedPrice}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {courseTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= OPTION A: FREE COURSE ENROLLMENT ================= */}
        {isFree ? (
          <div className="space-y-5">
            {freeSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">
                  You are Enrolled! 🎉
                </h4>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Access granted! Redirecting you to your lessons now...
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Course Tuition:</span>
                    <span className="font-bold text-emerald-700 font-mono">100% Free</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Access Mode:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Instant Lifetime Access
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200/70">
                    <span className="font-bold text-slate-900">Total Payable:</span>
                    <span className="font-bold text-emerald-700 text-base font-mono">₹0 (Free)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  This curriculum track is completely free for all registered students. Click below to instantly unlock all lessons and begin streaming.
                </p>

                {freeError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{freeError}</span>
                  </div>
                )}

                <button
                  onClick={handleFreeEnroll}
                  disabled={enrollingFree}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {enrollingFree ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Free Access...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Unlock Instant Free Access</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          /* ================= OPTION B: PAID COURSE (UPI or RAZORPAY) ================= */
          <div className="space-y-6">
            {/* Tabs: Instant Online vs Direct UPI Request */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
              <button
                onClick={() => setTab('razorpay')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  tab === 'razorpay'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Instant Online (Card / UPI)</span>
              </button>

              <button
                onClick={() => setTab('upi')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  tab === 'upi'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>Manual UPI / Approval</span>
              </button>
            </div>

            {paymentError && (
              <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>{paymentError}</p>
              </div>
            )}

            {/* TAB 1: MANUAL UPI / APPROVAL */}
            {tab === 'upi' && (
              <div>
                {requestSuccess ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-bold text-emerald-900">
                      Enrollment Request Submitted!
                    </h4>
                    <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                      Your request has been delivered to your instructor. Once verified, access will be granted to your dashboard immediately.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleManualRequest} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-amber-700" /> Direct UPI Transfer / Request Access
                      </p>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        Transfer the tuition ({formattedPrice}) to your instructor&apos;s UPI ID, then paste your 12-digit UPI Reference Number / UTR below for 1-click approval.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        UPI Reference / UTR Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 329182910291 (from GPay / PhonePe / Paytm)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Message / Phone Number for Verification
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Paid via GPay from 9876543210. Please grant access."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      />
                    </div>

                    {requestError && (
                      <p className="text-xs text-rose-600 font-medium">{requestError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submittingReq}
                      className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {submittingReq ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>Submit Request to Instructor</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: RAZORPAY ONLINE PAYMENT */}
            {tab === 'razorpay' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Course Tuition:</span>
                    <span className="font-bold text-slate-900 font-mono">{formattedPrice}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Access Mode:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Instant Lifetime Access
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Total Payable:</span>
                    <span className="font-bold text-amber-600 text-base font-mono">
                      {formattedPrice}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Supports Indian UPI (Google Pay, PhonePe, Paytm), Netbanking, and Credit/Debit Cards via Razorpay. Your course access unlocks automatically upon payment.
                </p>

                <button
                  onClick={handleRazorpayPayment}
                  disabled={payingOnline}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {payingOnline ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {formattedPrice} &amp; Unlock Instantly</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
