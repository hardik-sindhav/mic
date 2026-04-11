import { useCallback, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  fetchAllTicketsAdmin,
  fetchTicketDetail,
  updateTicketStatusAdmin,
  postTicketReply,
} from '../api/support.js'
import { SectionHeader } from '../components/layout/SectionHeader.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Loader } from '../components/ui/Loader.jsx'
import { Textarea } from '../components/ui/Textarea.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { API_BASE_URL } from '../config/env.js'
import { 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon, 
  Send, 
  User, 
  Search,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: MessageCircle },
  'in-progress': { label: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-foreground-subtle', bg: 'bg-surface-muted border border-border', icon: XCircle },
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SupportPage() {
  const { accessToken } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketDetail, setTicketDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyImages, setReplyImages] = useState([])
  const [sendingReply, setSendingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [solution, setSolution] = useState('')
  const [showSolutionInput, setShowSolutionInput] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)

  const loadTickets = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const data = await fetchAllTicketsAdmin(accessToken, statusFilter)
      setTickets(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [accessToken, statusFilter])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const loadTicketDetail = useCallback(async (id) => {
    if (!accessToken || !id) return
    setDetailLoading(true)
    try {
      const data = await fetchTicketDetail(accessToken, id)
      setTicketDetail(data)
      setSelectedTicketId(id)
      setSolution(data.solution || '')
      setShowSolutionInput(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetail(selectedTicketId)
    }
  }, [selectedTicketId, loadTicketDetail])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [ticketDetail?.replies])

  const handleStatusChange = async (newStatus) => {
    if (!ticketDetail || !accessToken) return
    
    if (newStatus === 'resolved' && !showSolutionInput && !ticketDetail.solution) {
      setShowSolutionInput(true)
      return
    }

    setUpdatingStatus(true)
    try {
      const updated = await updateTicketStatusAdmin(accessToken, ticketDetail._id, newStatus, solution)
      setTicketDetail(updated)
      setTickets(prev => prev.map(t => t._id === updated._id ? { ...t, status: updated.status } : t))
      toast.success(`Status updated to ${newStatus}`)
      setShowSolutionInput(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyMessage.trim() && replyImages.length === 0) return
    if (!ticketDetail || !accessToken) return

    setSendingReply(true)
    try {
      const updated = await postTicketReply(accessToken, ticketDetail._id, replyMessage, replyImages)
      setTicketDetail(updated)
      setReplyMessage('')
      setReplyImages([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('Reply sent')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingReply(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + replyImages.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    setReplyImages(prev => [...prev, ...files])
  }

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6">
      <SectionHeader 
        title="Customer Support" 
        description="Manage user inquiries, technical issues, and feedback."
        className="mb-0"
      />

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar: Ticket List */}
        <div className="w-80 flex flex-col gap-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-surface border border-border rounded-xl pl-10 pr-4 text-small focus:border-accent outline-none ring-2 ring-transparent focus:ring-accent/10 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${!statusFilter ? 'bg-accent text-accent-foreground shadow-glow' : 'bg-surface-muted border border-border text-foreground-muted hover:border-accent/30'}`}
            >
              All
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button 
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === key ? 'bg-accent text-accent-foreground shadow-glow' : 'bg-surface-muted border border-border text-foreground-muted hover:border-accent/30'}`}
              >
                {config.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface dark:bg-surface-elevated custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader /></div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-foreground-subtle text-small">No tickets found.</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTickets.map(ticket => {
                  const StatusIcon = STATUS_CONFIG[ticket.status].icon
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedTicketId(ticket._id)}
                      className={`w-full p-4 text-left transition-all hover:bg-accent/[0.03] group ${selectedTicketId === ticket._id ? 'bg-accent/[0.05] ring-1 ring-inset ring-accent/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_CONFIG[ticket.status].color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[ticket.status].label}
                        </span>
                        <span className="text-[10px] text-foreground-subtle">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <p className={`text-small font-bold text-foreground truncate mb-1 ${selectedTicketId === ticket._id ? 'text-accent' : ''}`}>{ticket.title}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full overflow-hidden border border-border bg-surface-muted shrink-0">
                          <img 
                            src={ticket.userId?.imageUrl || (ticket.userId?.image ? `${API_BASE_URL}${ticket.userId.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.userId?.name || 'User')}`)} 
                            alt="" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <span className="text-xs text-foreground-subtle truncate">{ticket.userId?.name || 'Unknown'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main View: Ticket Detail & Chat */}
        <div className="flex-1 flex flex-col rounded-2xl border border-border bg-surface dark:bg-surface-elevated overflow-hidden shadow-sm">
          {!selectedTicketId ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-surface-muted flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-foreground-subtle opacity-20" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Select a ticket</h3>
              <p className="max-w-xs text-foreground-subtle">Choose a support request from the list to view history and reply.</p>
            </div>
          ) : detailLoading && !ticketDetail ? (
            <div className="h-full flex items-center justify-center"><Loader size="lg" /></div>
          ) : ticketDetail ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border bg-surface-muted/30 dark:bg-surface-muted/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_CONFIG[ticketDetail.status].bg} ${STATUS_CONFIG[ticketDetail.status].color}`}>
                        {STATUS_CONFIG[ticketDetail.status].label}
                      </span>
                      <span className="text-xs text-foreground-subtle">ID: {ticketDetail._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-1 leading-tight">{ticketDetail.title}</h2>
                    <div className="flex items-center gap-4 text-small">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-foreground-subtle" />
                        <span className="font-medium">{ticketDetail.userId?.name}</span>
                        <span className="text-foreground-subtle">({ticketDetail.userId?.email})</span>
                      </div>
                      <span className="text-foreground-subtle">•</span>
                      <span className="text-foreground-subtle">{formatDate(ticketDetail.createdAt)} at {formatTime(ticketDetail.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-surface-muted/50 rounded-xl border border-border">
                      {['open', 'in-progress', 'resolved', 'closed'].map(s => (
                        <button
                          key={s}
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange(s)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${ticketDetail.status === s ? 'bg-surface text-foreground shadow-sm ring-1 ring-border' : 'text-foreground-muted hover:text-foreground hover:bg-surface/50'}`}
                        >
                          {s === 'in-progress' ? 'IP' : s.charAt(0).toUpperCase() + s.slice(1, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {showSolutionInput && (
                  <div className="mt-6 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3 text-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Add Final Solution</h4>
                    </div>
                    <Textarea 
                      placeholder="Explain how the issue was resolved..."
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      rows={2}
                      className="bg-surface/50"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => setShowSolutionInput(false)}>Cancel</Button>
                      <Button size="sm" loading={updatingStatus} onClick={() => handleStatusChange('resolved')}>Confirm Resolution</Button>
                    </div>
                  </div>
                )}

                {ticketDetail.status === 'resolved' && ticketDetail.solution && !showSolutionInput && (
                  <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <h4 className="text-[11px] font-bold uppercase tracking-wider">Resolution Solution</h4>
                    </div>
                    <p className="text-small text-foreground italic leading-relaxed">"{ticketDetail.solution}"</p>
                  </div>
                )}
              </div>

              {/* Chat Content */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-surface/50 dark:bg-transparent"
              >
                {/* Initial Issue */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                    <AlertCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="bg-surface border border-border p-5 rounded-2xl rounded-tl-none shadow-sm dark:bg-surface-elevated">
                      <p className="text-body text-foreground leading-relaxed whitespace-pre-wrap">{ticketDetail.description}</p>
                      
                      {ticketDetail.images && ticketDetail.images.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-5">
                          {ticketDetail.images.map((img, i) => (
                            <a 
                              key={i} 
                              href={img.startsWith('/') ? `${API_BASE_URL}${img}` : img} 
                              target="_blank" 
                              rel="noreferrer"
                              className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-surface-muted transition-all hover:ring-2 hover:ring-accent"
                            >
                              <img src={img.startsWith('/') ? `${API_BASE_URL}${img}` : img} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Search className="h-5 w-5 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-foreground-subtle font-medium uppercase tracking-wider">Initial Request • {formatTime(ticketDetail.createdAt)}</span>
                  </div>
                </div>

                {/* Replies */}
                {ticketDetail.replies.map((reply, i) => {
                  const isAdmin = reply.senderType === 'admin'
                  return (
                    <div key={reply._id || i} className={`flex gap-4 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border ${isAdmin ? 'bg-foreground/5 border-foreground/10' : 'bg-accent/5 border-accent/10'}`}>
                        {isAdmin ? <ShieldCheck className="h-5 w-5 text-foreground-muted" /> : <User className="h-5 w-5 text-accent" />}
                      </div>
                      <div className={`flex-1 space-y-2 max-w-[85%] ${isAdmin ? 'text-right' : ''}`}>
                        <div className={`inline-block text-left p-4 rounded-2xl shadow-sm border ${isAdmin ? 'bg-foreground text-foreground-inverse border-transparent rounded-tr-none' : 'bg-surface border-border rounded-tl-none dark:bg-surface-elevated'}`}>
                          <p className="text-small leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                          
                          {reply.images && reply.images.length > 0 && (
                            <div className={`flex flex-wrap gap-2 mt-4 ${isAdmin ? 'justify-end' : ''}`}>
                              {reply.images.map((img, idx) => (
                                <a 
                                  key={idx} 
                                  href={img.startsWith('/') ? `${API_BASE_URL}${img}` : img} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-black/5"
                                >
                                  <img src={img.startsWith('/') ? `${API_BASE_URL}${img}` : img} alt="" className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="block">
                          <span className="text-[10px] text-foreground-subtle font-medium uppercase tracking-wider">
                            {isAdmin ? 'Support Team' : ticketDetail.userId?.name} • {formatTime(reply.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Reply Input */}
              <div className="p-6 border-t border-border bg-surface dark:bg-surface-elevated">
                <form onSubmit={handleReply} className="space-y-4">
                  <div className="relative group">
                    <textarea 
                      placeholder={ticketDetail.status === 'closed' ? "This ticket is closed." : "Type your message here..."}
                      disabled={sendingReply || ticketDetail.status === 'closed'}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full min-h-[100px] bg-surface-muted/30 border border-border rounded-2xl p-4 pr-12 text-body focus:bg-surface focus:border-accent outline-none ring-2 ring-transparent focus:ring-accent/10 transition-all resize-none dark:bg-surface-muted/5 group-hover:border-border-strong disabled:opacity-50"
                    />
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                      />
                      <button 
                        type="button"
                        disabled={sendingReply || ticketDetail.status === 'closed'}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-foreground-subtle hover:text-accent hover:bg-accent/10 rounded-xl transition-all disabled:opacity-50"
                        title="Attach images (Max 5)"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {replyImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyImages.map((file, i) => (
                        <div key={i} className="relative group h-16 w-16 rounded-xl border border-border overflow-hidden bg-surface-muted">
                          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setReplyImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-foreground-subtle italic">
                      {ticketDetail.status === 'closed' ? 'Re-open the ticket to send a reply.' : 'Press Enter to send, Shift+Enter for new line.'}
                    </p>
                    <Button 
                      type="submit" 
                      loading={sendingReply} 
                      disabled={(!replyMessage.trim() && replyImages.length === 0) || ticketDetail.status === 'closed'}
                      className="px-8 shadow-glow"
                    >
                      <Send className="h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
