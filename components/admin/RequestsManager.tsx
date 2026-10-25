'use client'

import { useState } from 'react'
import { EnrollmentRequestItem, approveEnrollmentRequestAction, rejectEnrollmentRequestAction } from '@/lib/enrollment/actions'
import {
  ShieldCheck,
  Check,
  X,
  Loader2,
  Clock,
  QrCode,
  CreditCard,
  User,
  BookOpen,
} from 'lucide-react'

interface RequestsManagerProps {
  initialRequests: EnrollmentRequestItem[]
}

export function RequestsManager({ initialRequests }: RequestsManagerProps) {
  const [requests, setRequests] = useState<EnrollmentRequestItem[]>(initialRequests)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    setError(null)

    try {
      const res = await approveEnrollmentRequestAction(requestId)
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
        )
      } else {
        setError(res.error || 'Failed to approve request')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error approving request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const confirm = window.confirm('Are you sure you want to reject this request?')
    if (!confirm) return

    setProcessingId(requestId)
    setError(null)

    try {
      const res = await rejectEnrollmentRequestAction(requestId)
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
        )
      } else {
        setError(res.error || 'Failed to reject request')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error rejecting request')
    } finally {
      setProcessingId(null)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const completedRequests = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Enrollment Requests
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {pendingRequests.length} Pending
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review manual UPI transfers, offline payments, and student course access requests.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      {/* Pending Requests List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Awaiting Approval ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-400">
            No pending enrollment requests. All student applications have been processed.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="w-3 h-3 text-amber-700" />
                      Pending Review
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <strong className="text-slate-900">
                          {req.user?.name || 'Student'}
                        </strong>{' '}
                        <span className="text-slate-500">({req.user?.email})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <strong className="text-slate-900">
                        {req.course?.title || 'Course'}
                      </strong>
                    </div>
                  </div>

                  {/* Payment Reference & Notes */}
                  {(req.transaction_ref || req.notes) && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      {req.transaction_ref && (
                        <div className="flex items-center gap-1.5 font-mono text-slate-800">
                          <span className="text-slate-500 font-sans">UTR / Ref:</span>
                          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {req.transaction_ref}
                          </span>
                        </div>
                      )}
                      {req.notes && (
                        <p className="text-slate-600 italic">
                          "{req.notes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 1-Click Approve / Reject Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold disabled:opacity-50"
                    title="Reject Request"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {processingId === req.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Approve & Grant Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History */}
      {completedRequests.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Processed History ({completedRequests.length})
          </h2>

          <div className="space-y-2 opacity-80">
            {completedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {req.user?.name || req.user?.email}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-600">{req.course?.title}</span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(req.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
