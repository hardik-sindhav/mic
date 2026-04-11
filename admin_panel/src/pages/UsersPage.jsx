import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, ShieldAlert, ShieldCheck, Search, Ban, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { fetchUsers, deleteUser, toggleBlockUser } from '../api/users.js'
import { SectionHeader } from '../components/layout/SectionHeader.jsx'
import { Loader } from '../components/ui/Loader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { API_BASE_URL } from '../config/env.js'
import { UserActionDialog } from '../components/users/UserActionDialog.jsx'

function formatShortDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function UsersPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Dialog State
  const [dialogConfig, setDialogConfig] = useState({ open: false, user: null, type: 'block' })

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const data = await fetchUsers(accessToken)
      setUsers(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    load()
  }, [load])

  const openDialog = (user, type) => {
    setDialogConfig({ open: true, user, type })
  }

  const closeDialog = () => {
    if (!actionLoading) setDialogConfig({ open: false, user: null, type: 'block' })
  }

  async function handleConfirmAction(reason) {
    const { user, type } = dialogConfig
    if (!user || !accessToken) return

    setActionLoading(true)
    try {
      if (type === 'delete') {
        await deleteUser(accessToken, user._id)
        toast.success('User permanently deleted')
        setUsers(users.filter(u => u._id !== user._id))
      } else {
        // block or unblock
        const res = await toggleBlockUser(accessToken, user._id, reason)
        toast.success(res.isBlocked ? 'User account suspended' : 'User access restored')
        setUsers(users.map(u => u._id === user._id ? { ...u, isBlocked: res.isBlocked, blockReason: res.blockReason } : u))
      }
      setDialogConfig({ open: false, user: null, type: 'block' })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.deviceId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title="Users"
          description="Manage mobile app users, monitor activity, and handle account restrictions."
          className="mb-0"
        />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="text"
            placeholder="Search name, email, or device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-small transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader size="lg" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm dark:bg-surface-elevated">
          <table className="w-full border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-border bg-surface-muted/30 dark:bg-surface-muted/10">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-foreground-muted">User</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-foreground-muted">Device / Country</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-foreground-muted">Stats</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-foreground-muted">Joined</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-foreground-muted">Status</th>
                <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-foreground-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user._id} className={`transition-colors hover:bg-accent/[0.02] ${user.isBlocked ? 'bg-red-500/[0.02]' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface-muted">
                        <img 
                          src={user.imageUrl || (user.image ? `${API_BASE_URL}${user.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`)} 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-foreground-subtle truncate">{user.email || 'Guest Account'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-foreground-subtle uppercase truncate max-w-[120px]" title={user.deviceId}>
                        {user.deviceId}
                      </p>
                      <span className="inline-flex items-center rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground-muted">
                        {user.country || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-foreground">{user.wins || 0}</p>
                        <p className="text-[9px] uppercase text-foreground-subtle">Wins</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{user.cardsHeld || 0}</p>
                        <p className="text-[9px] uppercase text-foreground-subtle">Cards</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground-subtle whitespace-nowrap">
                    {formatShortDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-red-600 w-fit">
                          <Ban className="h-3 w-3" /> Blocked
                        </span>
                        {user.blockReason && (
                          <p className="text-[10px] text-foreground-subtle italic line-clamp-1 max-w-[120px]" title={user.blockReason}>
                            "{user.blockReason}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-600">
                        <UserCheck className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openDialog(user, user.isBlocked ? 'unblock' : 'block')}
                        disabled={actionLoading}
                        className={`rounded-lg p-2 transition-colors ${user.isBlocked ? 'text-emerald-600 hover:bg-emerald-500/10' : 'text-amber-600 hover:bg-amber-500/10'}`}
                        title={user.isBlocked ? 'Unblock User' : 'Block User'}
                      >
                        {user.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openDialog(user, 'delete')}
                        disabled={actionLoading}
                        className="rounded-lg p-2 text-foreground-subtle hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-foreground-subtle">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Dialog */}
      <UserActionDialog
        open={dialogConfig.open}
        user={dialogConfig.user}
        type={dialogConfig.type}
        loading={actionLoading}
        onClose={closeDialog}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
