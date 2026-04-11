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
} from '../api/settings.js'
import { SectionHeader } from '../components/layout/SectionHeader.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Loader } from '../components/ui/Loader.jsx'
import { Textarea } from '../components/ui/Textarea.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { GripVertical, Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react'

export function SettingsPage() {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader size="lg" /></div>
  }

  return (
    <div className="space-y-10 pb-20">
      <SectionHeader title="Settings" description="Manage app updates and multiple in-app advertisements." />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: App Updates */}
        <div className="lg:col-span-1 space-y-6">
          <Card accentTop>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <h3 className="font-display text-lg font-semibold">App Update</h3>
              <Input label="Latest Version" value={appSettings.latestVersion} onChange={(e) => setAppSettings({ ...appSettings, latestVersion: e.target.value })} required />
              <Input label="Update URL" value={appSettings.updateUrl} onChange={(e) => setAppSettings({ ...appSettings, updateUrl: e.target.value })} />
              <Textarea label="Update Notes" value={appSettings.updateNote} onChange={(e) => setAppSettings({ ...appSettings, updateNote: e.target.value })} rows={3} />
              
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/30 p-4">
                <div>
                  <p className="text-small font-medium">Force Update</p>
                  <p className="text-[12px] text-foreground-subtle">Block app use until updated.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppSettings({ ...appSettings, forceUpdate: !appSettings.forceUpdate })}
                  className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${appSettings.forceUpdate ? 'bg-accent' : 'bg-surface-muted border border-border'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white transition-transform ${appSettings.forceUpdate ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Button type="submit" className="w-full" loading={submitting}>Save Version Settings</Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Multiple Custom Ads */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Custom Advertisements</h3>
            <Button onClick={addNewAd} variant="secondary" className="h-10">
              <Plus className="h-4 w-4" /> Add New Ad
            </Button>
          </div>

          <div className="space-y-4">
            {customAds.map((ad, index) => (
              <div
                key={ad._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-2xl border border-border bg-surface transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
              >
                {/* Header with toggle and drag handle */}
                <div className="flex items-center justify-between border-b border-border bg-surface-muted/20 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-1 text-foreground-subtle hover:text-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">Ad #{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase text-foreground-subtle">{ad.enabled ? 'Active' : 'Inactive'}</span>
                      <button
                        onClick={() => updateAdField(ad._id, 'enabled', !ad.enabled)}
                        className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${ad.enabled ? 'bg-emerald-500' : 'bg-surface-muted border border-border'}`}
                      >
                        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${ad.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <button onClick={() => removeAd(ad._id)} className="text-foreground-subtle hover:text-error transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-4">
                    <Input label="Heading" value={ad.heading} onChange={(e) => updateAdField(ad._id, 'heading', e.target.value)} />
                    <Input label="Subheading" value={ad.subheading} onChange={(e) => updateAdField(ad._id, 'subheading', e.target.value)} />
                  </div>
                  <div className="space-y-4">
                    <Input label="Button Text" value={ad.buttonText} onChange={(e) => updateAdField(ad._id, 'buttonText', e.target.value)} />
                    <Input label="Target URL" value={ad.targetUrl} onChange={(e) => updateAdField(ad._id, 'targetUrl', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Media URL (Image/Video)" value={ad.mediaUrl} onChange={(e) => updateAdField(ad._id, 'mediaUrl', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button onClick={() => saveAd(ad._id)} className="h-10 px-6">
                      <Save className="h-4 w-4" /> Save Ad
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {customAds.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center text-foreground-subtle">
                No custom ads yet. Click "Add New Ad" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
