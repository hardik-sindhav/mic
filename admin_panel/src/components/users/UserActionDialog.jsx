import { useEffect, useRef, useState } from 'react'
import { ShieldAlert, ShieldCheck, X, Trash2, Ban } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Textarea } from '../ui/Textarea.jsx'
import { API_BASE_URL } from '../../config/env.js'

/**
 * High-quality confirmation dialog for User actions (Block/Delete)
 */
export function UserActionDialog({ 
  open, 
  user, 
  onClose, 
  onConfirm, 
  loading,
  type = 'block' // 'block' | 'delete' | 'unblock'
}) {
  const [reason, setReason] = useState('')
  const [showReasonInput, setShowReasonReasonInput] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const userImageUrl = user?.imageUrl || (user?.image ? `${API_BASE_URL}${user.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`)

  useEffect(() => {
    if (!open) {
      setReason('')
      setShowReasonReasonInput(false)
      return
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, loading])

  if (!open || !user) return null

  const config = {
    block: {
      title: 'Suspend Account?',
      desc: 'The user will be immediately logged out and blocked from accessing the app.',
      confirm: 'Suspend User',
      variant: 'danger',
      icon: <Ban className="h-4 w-4 text-error" />,
      color: 'text-error',
      bgColor: 'bg-red-500/10'
    },
    unblock: {
      title: 'Restore Account?',
      desc: 'This will remove the suspension and allow the user to log in again.',
      confirm: 'Restore Access',
      variant: 'primary',
      icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    delete: {
      title: 'Delete User Forever?',
      desc: 'This action is permanent. All user data, stats, and records will be wiped.',
      confirm: 'Delete Permanently',
      variant: 'danger',
      icon: <Trash2 className="h-4 w-4 text-error" />,
      color: 'text-error',
      bgColor: 'bg-red-500/10'
    }
  }[type]

  const handleInitialConfirm = () => {
    if (type === 'block' && !showReasonInput) {
      setShowReasonReasonInput(true)
    } else {
      onConfirm(reason)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[3px] dark:bg-foreground/50"
        onClick={() => !loading && onClose()}
      />
      <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-surface shadow-2xl dark:border-border-strong dark:bg-surface-elevated sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}>
              {config.icon}
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">{config.title}</h2>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-1 text-foreground-subtle hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          {!showReasonInput ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-border shadow-sm">
                <img 
                  src={userImageUrl} 
                  alt="" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-foreground">{user.name}</p>
                <p className="text-small text-foreground-muted">{user.email || 'Guest ID: ' + user.deviceId}</p>
              </div>
              <p className="text-body text-foreground-muted leading-relaxed">
                {config.desc}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-red-500/5 p-4 border border-red-500/10">
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Account Suspension</p>
                <p className="text-small text-foreground-muted">Please provide a reason. This will be shown to the user when they try to log in.</p>
              </div>
              <Textarea
                label="Reason for blocking"
                placeholder="e.g. Violation of terms, suspicious activity..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                autoFocus
              />
            </div>
          )}
        </div>

        <footer className="border-t border-border px-6 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant={config.variant === 'danger' ? 'primary' : 'primary'}
              className={config.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              loading={loading}
              disabled={loading || (showReasonInput && !reason.trim())}
              onClick={handleInitialConfirm}
            >
              {showReasonInput ? 'Confirm Block' : config.confirm}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
