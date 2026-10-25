'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    Razorpay?: unknown
  }
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

export interface RazorpayPayButtonProps {
  amountInPaise?: number // e.g. 499900 for ₹4999
  amountInInr?: number // e.g. 4999
  currency?: string
  courseId?: string
  name?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  onSuccess?: (data: { paymentId: string; orderId: string; signature: string }) => void
  onFailure?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export function RazorpayPayButton({
  amountInPaise,
  amountInInr,
  currency = 'INR',
  courseId,
  name = 'ANVESHA Engineering',
  description = 'Course Enrollment',
  prefill,
  onSuccess,
  onFailure,
  className = '',
  children,
}: RazorpayPayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Calculate amount in paise (minimum 100 paise = ₹1)
  const finalAmount = amountInPaise
    ? Math.max(amountInPaise, 100)
    : amountInInr
    ? Math.max(Math.round(amountInInr * 100), 100)
    : undefined

  const handleCheckout = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Call Backend Order Creation Endpoint
      const createRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency,
          courseId,
        }),
      })

      const orderData = await createRes.json()

      if (!createRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment order.')
      }

      // 2. Ensure Razorpay Checkout SDK is Loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Razorpay Checkout SDK'))
          document.body.appendChild(script)
        })
      }

      const RazorpayClass = window.Razorpay as RazorpayConstructor

      // 3. Configure Checkout Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name,
        description: orderData.courseTitle || description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill?.name || orderData.userName || '',
          email: prefill?.email || orderData.userEmail || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Call Backend Signature Verification Endpoint
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId,
              }),
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok || !verifyData.success) {
              const err = verifyData.error || 'Payment signature verification failed.'
              setErrorMsg(err)
              onFailure?.(err)
              return
            }

            onSuccess?.({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Payment verification network error'
            setErrorMsg(msg)
            onFailure?.(msg)
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const rzp = new RazorpayClass(options)
      rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
        const desc = resp.error?.description || 'Payment was declined or cancelled.'
        setErrorMsg(desc)
        onFailure?.(desc)
        setLoading(false)
      })

      rzp.open()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout initiation failed'
      setErrorMsg(msg)
      onFailure?.(msg)
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md transition-all disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          children || (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Pay with Razorpay</span>
            </>
          )
        )}
      </button>

      {errorMsg && (
        <span className="text-[11px] text-rose-600 font-medium px-1">{errorMsg}</span>
      )}
    </div>
  )
}
