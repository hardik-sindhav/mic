import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  fetchAppSettings,
  fetchCustomAdsAdmin,
  updateAppSettings,
  createCustomAd,
  updateCustomAd,
  deleteCustomAd,
  reorderCustomAds,
  sendGlobalNotification,
} from '../api/settings.js'
import { SectionHeader } from '../components/layout/SectionHeader.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Loader } from '../components/ui/Loader.jsx'
import { Textarea } from '../components/ui/Textarea.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { GripVertical, Plus, Trash2, Save, ArrowUp, ArrowDown, Smartphone, Megaphone, Bell, ShieldAlert } from 'lucide-react'

export function SettingsPage() {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('updates') // 'updates' | 'ads' | 'notifications'

  // App Settings State
  const [appSettings, setAppSettings] = useState({
    latestVersion: '1.0.0',
    updateUrl: '',
    updateNote: '',
    forceUpdate: false,
  })

  // Custom Ads State
  const [customAds, setCustomAds] = useState([])
  const [draggedIndex, setDragIndex] = useState(null)

  // Notification State
  const [notif, setNotif] = useState({ title: '', body: '', imageUrl: '' })
  const [sendingNotif, setSendingNotif] = useState(false)

  const loadData = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const [settings, ads] = await Promise.all([
        fetchAppSettings(accessToken),
        fetchCustomAdsAdmin(accessToken),
      ])
      if (settings) setAppSettings(settings)
      if (ads) setCustomAds(ads)
    } catch (err) {
      toast.error(err.message || 'Could not load settings.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  // App Settings Handlers
  async function handleUpdateSettings(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateAppSettings(accessToken, appSettings)
      toast.success('App settings updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update app settings')
    } finally {
      setSubmitting(false)
    }
  }

  // Custom Ad Handlers
  async function addNewAd() {
    try {
      const newAd = await createCustomAd(accessToken, {
        enabled: false,
        heading: 'New Promotion',
        subheading: '',
        buttonText: 'Learn More',
        targetUrl: '',
        mediaUrl: '',
      })
      setCustomAds([...customAds, newAd])
      toast.success('New ad created')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function updateAdField(id, field, value) {
    const updatedAds = customAds.map(ad => 
      ad._id === id ? { ...ad, [field]: value } : ad
    )
    setCustomAds(updatedAds)
  }

  async function saveAd(id) {
    const ad = customAds.find(a => a._id === id)
    try {
      await updateCustomAd(accessToken, id, ad)
      toast.success('Ad saved')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function removeAd(id) {
    if (!confirm('Are you sure you want to delete this ad?')) return
    try {
      await deleteCustomAd(accessToken, id)
      setCustomAds(customAds.filter(ad => ad._id !== id))
      toast.success('Ad deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Drag and Drop Logic
  const handleDragStart = (index) => setDragIndex(index)
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const newAds = [...customAds]
    const item = newAds.splice(draggedIndex, 1)[0]
    newAds.splice(index, 0, item)
    setCustomAds(newAds)
    setDragIndex(index)
  }
  const handleDragEnd = async () => {
    setDragIndex(null)
    try {
      const order = customAds.map(ad => ad._id)
      await reorderCustomAds(accessToken, order)
      toast.success('Order updated')
    } catch (err) {
      toast.error('Failed to save order')
    }
  }

  // Notification Handlers
  async function handleSendNotification(e) {
    e.preventDefault()
    if (!notif.title || !notif.body) {
      toast.error('Title and Body are required')
      return
    }
    setSendingNotif(true)
    try {
      await sendGlobalNotification(accessToken, notif)
      toast.success('Notification sent to all users')
      setNotif({ title: '', body: '', imageUrl: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingNotif(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader size="lg" /></div>
  }

  return (
    <div className="space-y-8 pb-20">
      <SectionHeader title="Settings" description="Configure platform behavior, mobile app updates, and global promotions." />

      {/* Sub-menu Tabs */}
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-surface p-1.5 shadow-sm dark:border-border-strong dark:bg-surface-elevated w-fit">
        <button
          onClick={() => setActiveTab('updates')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-small font-semibold transition-all ${
            activeTab === 'updates'
              ? 'bg-accent text-accent-foreground shadow-glow'
              : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          App Updates
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-small font-semibold transition-all ${
            activeTab === 'ads'
              ? 'bg-accent text-accent-foreground shadow-glow'
              : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Promotions (Ads)
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-small font-semibold transition-all ${
            activeTab === 'notifications'
              ? 'bg-accent text-accent-foreground shadow-glow'
              : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
          }`}
        >
          <Bell className="h-4 w-4" />
          Push Notifications
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'updates' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card accentTop>
              <form onSubmit={handleUpdateSettings} className="space-y-8">
                <div>
                  <h3 className="font-display text-2xl font-bold">App Update Policy</h3>
                  <p className="mt-1 text-body text-foreground-muted">
                    Set the minimum required version and download destination for all platforms.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Latest Version" value={appSettings.latestVersion} onChange={(e) => setAppSettings({ ...appSettings, latestVersion: e.target.value })} required placeholder="e.g. 1.2.0" />
                      <Input label="Update URL" value={appSettings.updateUrl} onChange={(e) => setAppSettings({ ...appSettings, updateUrl: e.target.value })} placeholder="Store or APK link" />
                    </div>
                    <Textarea label="Update Notes" value={appSettings.updateNote} onChange={(e) => setAppSettings({ ...appSettings, updateNote: e.target.value })} rows={6} placeholder="Describe what's new in this release..." />
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1 rounded-3xl border border-border bg-surface-muted/30 p-6 dark:bg-surface-muted/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold">Force Update</h4>
                          <button
                            type="button"
                            onClick={() => setAppSettings({ ...appSettings, forceUpdate: !appSettings.forceUpdate })}
                            className={`inline-flex h-7 w-12 items-center rounded-full transition-colors ${appSettings.forceUpdate ? 'bg-accent' : 'bg-surface-muted border border-border'}`}
                          >
                            <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${appSettings.forceUpdate ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <p className="text-body text-foreground-subtle leading-relaxed">
                          When enabled, users will be prevented from accessing any part of the app until they have installed the latest version. Use this for critical security patches or breaking API changes.
                        </p>
                        
                        <div className="mt-8 rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4">
                          <p className="text-[12px] text-amber-600 font-medium">
                            💡 Tip: Make sure your Update URL is valid before enabling Force Update to avoid locking out your users.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-6">
                  <Button type="submit" className="w-full sm:w-auto px-10" loading={submitting}>
                    <Save className="h-4 w-4" />
                    Save Version Settings
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card accentTop>
              <form onSubmit={handleSendNotification} className="space-y-8">
                <div>
                  <h3 className="font-display text-2xl font-bold">Global Push Notification</h3>
                  <p className="mt-1 text-body text-foreground-muted">
                    Send a real-time broadcast message to every registered user via Firebase.
                  </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <Input 
                      label="Notification Title" 
                      value={notif.title} 
                      onChange={(e) => setNotif({ ...notif, title: e.target.value })} 
                      placeholder="e.g. New Cards Available!" 
                      required 
                    />
                    
                    <Textarea 
                      label="Message Body" 
                      value={notif.body} 
                      onChange={(e) => setNotif({ ...notif, body: e.target.value })} 
                      rows={5} 
                      placeholder="Enter the message you want users to see..." 
                      required 
                    />
                  </div>

                  <div className="space-y-6">
                    <Input 
                      label="Image URL (Optional)" 
                      value={notif.imageUrl} 
                      onChange={(e) => setNotif({ ...notif, imageUrl: e.target.value })} 
                      placeholder="https://... (jpg or png)" 
                    />

                    <div className="rounded-3xl bg-red-500/5 border border-red-500/10 p-6">
                      <div className="flex items-center gap-3 mb-3 text-red-600">
                        <ShieldAlert className="h-5 w-5" />
                        <h4 className="font-bold">Critical Action</h4>
                      </div>
                      <p className="text-small text-foreground-muted leading-relaxed">
                        This action will trigger a push notification to <strong>every user</strong> in your database who has allowed notifications. This process cannot be stopped once initiated.
                      </p>
                    </div>

                    {notif.imageUrl && (
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-surface-muted">
                        <img src={notif.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-6">
                  <Button type="submit" className="w-full sm:w-auto px-10" loading={sendingNotif}>
                    <Bell className="h-4 w-4" />
                    Send Global Notification
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold">In-App Promotions</h3>
                <p className="mt-1 text-body text-foreground-muted">
                  Create and reorder custom banners that appear in your mobile app.
                </p>
              </div>
              <Button onClick={addNewAd} className="w-full sm:w-auto shadow-sm">
                <Plus className="h-4 w-4" />
                Create New Ad
              </Button>
            </div>

            <div className="grid gap-6">
              {customAds.map((ad, index) => (
                <div
                  key={ad._id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative rounded-3xl border border-border bg-surface transition-all hover:border-accent/30 hover:shadow-md ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Media Preview Column */}
                    <div className="sm:w-1/3 p-4">
                      {ad.mediaUrl ? (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-surface-muted">
                          {ad.mediaUrl.endsWith('.mp4') ? (
                            <video src={ad.mediaUrl} className="h-full w-full object-cover" muted />
                          ) : (
                            <img src={ad.mediaUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/50 text-[11px] text-foreground-subtle uppercase tracking-widest font-bold">
                          No Media
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 p-6 sm:pl-2">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="cursor-grab active:cursor-grabbing p-1 text-foreground-subtle hover:text-foreground">
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-accent px-2 py-0.5 rounded bg-accent/10">Priority {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-muted/30 px-3 py-1.5">
                            <span className="text-[10px] font-bold uppercase text-foreground-muted">{ad.enabled ? 'Live' : 'Paused'}</span>
                            <button
                              onClick={() => updateAdField(ad._id, 'enabled', !ad.enabled)}
                              className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${ad.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-surface-muted border border-border'}`}
                            >
                              <span className={`h-4 w-4 rounded-full bg-white transition-transform ${ad.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <button onClick={() => removeAd(ad._id)} className="rounded-xl p-2 text-foreground-subtle hover:bg-red-500/10 hover:text-error transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Input label="Main Heading" value={ad.heading} onChange={(e) => updateAdField(ad._id, 'heading', e.target.value)} placeholder="e.g. 50% Season Sale" />
                        <Input label="Subheading" value={ad.subheading} onChange={(e) => updateAdField(ad._id, 'subheading', e.target.value)} placeholder="Short description..." />
                        <Input label="Button Label" value={ad.buttonText} onChange={(e) => updateAdField(ad._id, 'buttonText', e.target.value)} />
                        <Input label="Destination URL" value={ad.targetUrl} onChange={(e) => updateAdField(ad._id, 'targetUrl', e.target.value)} placeholder="https://..." />
                        <div className="sm:col-span-2">
                          <Input label="Background Media URL" value={ad.mediaUrl} onChange={(e) => updateAdField(ad._id, 'mediaUrl', e.target.value)} placeholder="Direct link to image or MP4" />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button onClick={() => saveAd(ad._id)} className="w-full sm:w-auto px-8 shadow-sm">
                          <Save className="h-4 w-4" />
                          Update Ad #{index + 1}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {customAds.length === 0 && (
                <div className="rounded-3xl border border-dashed border-border py-20 text-center bg-surface-muted/20">
                  <Megaphone className="mx-auto h-10 w-10 text-foreground-subtle opacity-20 mb-4" />
                  <p className="text-body font-medium text-foreground-muted">No promotions configured.</p>
                  <Button onClick={addNewAd} variant="ghost" className="mt-2 text-accent">Create your first ad</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
