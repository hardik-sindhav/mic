import { useCallback, useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { fetchAdConfig, updateAdConfig } from '../api/settings.js'
import { SectionHeader } from '../components/layout/SectionHeader.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Loader } from '../components/ui/Loader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { GripVertical, Save } from 'lucide-react'
import admobLogo from '../assets/admob.png'
import metaLogo from '../assets/meta.png'
import unityLogo from '../assets/unity.png'
import applovinLogo from '../assets/appLovin.png'

const NETWORK_KEYS = ['google', 'meta', 'unity', 'applovin']

const PLATFORM_META = {
  google: { title: 'Google AdMob', logo: admobLogo },
  meta: { title: 'Meta Ads', logo: metaLogo },
  unity: { title: 'Unity Ads', logo: unityLogo },
  applovin: { title: 'AppLovin', logo: applovinLogo },
}

export function AdManagerPage() {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState(null)

  const [draggedIndex, setDragIndex] = useState(null)

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const data = await fetchAdConfig(accessToken)
      setConfig(data)
    } catch (e) {
      toast.error(e.message || 'Could not load ad configuration.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(e) {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updateAdConfig(accessToken, config)
      toast.success('Ad configuration saved successfully.')
    } catch (err) {
      toast.error(err.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newOrder = [...config.loadOrder]
    const item = newOrder.splice(draggedIndex, 1)[0]
    newOrder.splice(index, 0, item)
    
    setConfig({ ...config, loadOrder: newOrder })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const moveOrder = (index, direction) => {
    const newOrder = [...config.loadOrder]
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= newOrder.length) return
    
    const temp = newOrder[index]
    newOrder[index] = newOrder[nextIndex]
    newOrder[nextIndex] = temp
    
    setConfig({ ...config, loadOrder: newOrder })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title="Ad Manager"
          description="Configure ad networks, unit IDs, and the waterfall load order for your app."
          className="mb-0"
        />
        <Button onClick={handleSave} loading={saving} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Waterfall Load Order */}
        <section className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm dark:border-border-strong dark:bg-surface-elevated">
            <h3 className="font-display text-lg font-semibold text-foreground">Waterfall Order</h3>
            <p className="mt-1 text-small text-foreground-muted mb-6">
              Drag or use arrows to set which network loads first.
            </p>
            
            <div className="space-y-3">
              {config.loadOrder.map((key, index) => {
                const meta = PLATFORM_META[key]
                if (!meta) return null
                const isDragging = draggedIndex === index
                
                return (
                  <div 
                    key={key} 
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      isDragging 
                        ? 'border-accent bg-accent/10 opacity-50 scale-95' 
                        : 'border-border bg-surface-muted/20 dark:bg-surface-muted/5 hover:border-accent/30'
                    }`}
                  >
                    <div className="flex shrink-0 items-center justify-center w-8 text-foreground-subtle">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded bg-white p-1 shadow-sm">
                      <img src={meta.logo} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-small font-bold text-foreground truncate">{meta.title}</p>
                      <p className="text-[10px] text-foreground-subtle uppercase tracking-wider">Priority {index + 1}</p>
                    </div>
                    <div className="flex flex-col gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity lg:flex">
                      <button 
                        type="button"
                        onClick={() => moveOrder(index, -1)}
                        disabled={index === 0}
                        className="p-1 hover:bg-surface rounded disabled:opacity-30"
                        title="Move Up"
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => moveOrder(index, 1)}
                        disabled={index === config.loadOrder.length - 1}
                        className="p-1 hover:bg-surface rounded disabled:opacity-30"
                        title="Move Down"
                      >
                        <GripVertical className="h-3 w-3 -rotate-90" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-[12px] text-accent font-medium leading-relaxed">
                💡 Your app will try to load ads in this specific order. If the first network fails or has no fill, it moves to the next.
              </p>
            </div>
          </div>
        </section>

        {/* Network Details */}
        <section className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 sm:grid-cols-1">
            {NETWORK_KEYS.map((key) => {
              const meta = PLATFORM_META[key]
              const net = config[key]
              return (
                <div key={key} className="rounded-2xl border border-border bg-surface overflow-hidden dark:border-border-strong dark:bg-surface-elevated">
                  <div className="flex items-center justify-between bg-surface-muted/30 px-6 py-4 dark:bg-surface-muted/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-white p-1.5 shadow-sm border border-border">
                        <img src={meta.logo} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                      <h3 className="font-display font-bold text-foreground">{meta.title}</h3>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={net.enabled}
                      onClick={() => setConfig({
                        ...config,
                        [key]: { ...net, enabled: !net.enabled }
                      })}
                      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        net.enabled ? 'bg-accent' : 'bg-surface-muted border border-border'
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          net.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {net.enabled && (
                    <div className="p-6 grid gap-4 sm:grid-cols-3">
                      <Input
                        label="Banner ID"
                        value={net.bannerAdUnitId}
                        onChange={(e) => setConfig({
                          ...config,
                          [key]: { ...net, bannerAdUnitId: e.target.value }
                        })}
                        placeholder="Unit ID"
                      />
                      <Input
                        label="Interstitial ID"
                        value={net.interstitialAdUnitId}
                        onChange={(e) => setConfig({
                          ...config,
                          [key]: { ...net, interstitialAdUnitId: e.target.value }
                        })}
                        placeholder="Unit ID"
                      />
                      <Input
                        label="Rewarded ID"
                        value={net.rewardedAdUnitId}
                        onChange={(e) => setConfig({
                          ...config,
                          [key]: { ...net, rewardedAdUnitId: e.target.value }
                        })}
                        placeholder="Unit ID"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
