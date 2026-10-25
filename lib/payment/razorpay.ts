import Razorpay from 'razorpay'
import crypto from 'crypto'

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.')
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

export interface CreateOrderParams {
  amount: number // in paise (minimum 100)
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  notes,
}: CreateOrderParams) {
  if (!amount || amount < 100) {
    throw new Error('Amount must be at least 100 paise (₹1.00).')
  }

  const razorpay = getRazorpayClient()

  const order = await razorpay.orders.create({
    amount: Math.round(amount),
    currency,
    receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    notes: notes || {},
  })

  return {
    order_id: order.id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: order.status,
  }
}

export interface VerifySignatureParams {
  orderId: string
  paymentId: string
  signature: string
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured on the server.')
  }

  if (!orderId || !paymentId || !signature) {
    return false
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  try {
    const a = Buffer.from(generatedSignature, 'utf8')
    const b = Buffer.from(signature, 'utf8')
    if (a.length !== b.length) {
      return false
    }
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
