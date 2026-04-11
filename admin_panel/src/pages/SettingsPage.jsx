import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { fetchAdConfig, fetchAppSettings, updateAdConfig, updateAppSettings } from '../api/settings.js'
import { SectionHeader } from '../components/layout/SectionHeader.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Loader } from '../components/ui/Loader.jsx'
import { Textarea } from '../components/ui/Textarea.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function SettingsPage() {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // App Settings State (Updates only)
  const [appSettings, setAppSettings] = useState({
    latestVersion: '1.0.0',
    updateUrl: '',
    updateNote: '',
    forceUpdate: false,
  })

  // Custom Ad State
  const [adConfig, setAdConfig] = useState({
    customAd: {
      enabled: false,
      heading: '',
      subheading: '',
      buttonText: '',
      targetUrl: '',
      mediaUrl: '',
    },
  })

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return
      setLoading(true)
      try {
        const [settings, ads] = await Promise.all([
          fetchAppSettings(accessToken),
          fetchAdConfig(accessToken),
        ])
        if (settings) {
          setAppSettings({
            latestVersion: settings.latestVersion || '1.0.0',
            updateUrl: settings.updateUrl || '',
            updateNote: settings.updateNote || '',
            forceUpdate: !!settings.forceUpdate,
          })
        }
        if (ads && ads.customAd) {
          setAdConfig({
            customAd: {
              enabled: !!ads.customAd.enabled,
              heading: ads.customAd.heading || '',
              subheading: ads.customAd.subheading || '',
              buttonText: ads.customAd.buttonText || '',
              targetUrl: ads.customAd.targetUrl || '',
              mediaUrl: ads.customAd.mediaUrl || '',
            },
          })
        }
      } catch (err) {
        toast.error(err.message || 'Could not load settings.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [accessToken])

  async function handleUpdateSettings(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateAppSettings(accessToken, appSettings)
      toast.success('App settings updated successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to update app settings')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateAds(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateAdConfig(accessToken, adConfig)
      toast.success('Custom ad updated successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to update custom ad')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      <SectionHeader
        title="Settings"
        description="Manage app updates and in-app custom advertisements."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* App Update Section */}
        <section className="space-y-6">
          <Card accentTop>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">App Update</h3>
                <p className="mt-1 text-small text-foreground-muted">
                  Configure the latest version and update policy.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Latest Version"
                  value={appSettings.latestVersion}
                  onChange={(e) => setAppSettings({ ...appSettings, latestVersion: e.target.value })}
                  placeholder="e.g. 1.1.0"
                  required
                />
                <Input
                  label="Update URL"
                  value={appSettings.updateUrl}
                  onChange={(e) => setAppSettings({ ...appSettings, updateUrl: e.target.value })}
                  placeholder="Store or download link"
                />
              </div>

              <Textarea
                label="Update Notes"
                value={appSettings.updateNote}
                onChange={(e) => setAppSettings({ ...appSettings, updateNote: e.target.value })}
                placeholder="What's new in this version..."
                rows={3}
              />

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/30 p-4 dark:bg-surface-muted/10">
                <div>
                  <p className="text-small font-medium text-foreground">Force Update</p>
                  <p className="text-[12px] text-foreground-subtle">Block app use until updated.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={appSettings.forceUpdate}
                  onClick={() => setAppSettings({ ...appSettings, forceUpdate: !appSettings.forceUpdate })}
                  className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    appSettings.forceUpdate ? 'bg-accent' : 'bg-surface-muted border border-border'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      appSettings.forceUpdate ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
                Save App Settings
              </Button>
            </form>
          </Card>
        </section>

        {/* Custom Ad Section */}
        <section className="space-y-6">
          <Card accentTop>
            <form onSubmit={handleUpdateAds} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Custom Ad</h3>
                  <p className="mt-1 text-small text-foreground-muted">
                    Display a custom banner/video in your app.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={adConfig.customAd.enabled}
                  onClick={() =>
                    setAdConfig({
                      ...adConfig,
                      customAd: { ...adConfig.customAd, enabled: !adConfig.customAd.enabled },
                    })
                  }
                  className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    adConfig.customAd.enabled ? 'bg-accent' : 'bg-surface-muted border border-border'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      adConfig.customAd.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-4 pt-2">
                <Input
                  label="Heading"
                  value={adConfig.customAd.heading}
                  onChange={(e) =>
                    setAdConfig({
                      ...adConfig,
                      customAd: { ...adConfig.customAd, heading: e.target.value },
                    })
                  }
                  placeholder="e.g. Get Premium Access"
                />
                <Input
                  label="Subheading"
                  value={adConfig.customAd.subheading}
                  onChange={(e) =>
                    setAdConfig({
                      ...adConfig,
                      customAd: { ...adConfig.customAd, subheading: e.target.value },
                    })
                  }
                  placeholder="e.g. Unlock all cards today"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Button Text"
                    value={adConfig.customAd.buttonText}
                    onChange={(e) =>
                      setAdConfig({
                        ...adConfig,
                        customAd: { ...adConfig.customAd, buttonText: e.target.value },
                      })
                    }
                    placeholder="e.g. Learn More"
                  />
                  <Input
                    label="Target URL"
                    value={adConfig.customAd.targetUrl}
                    onChange={(e) =>
                      setAdConfig({
                        ...adConfig,
                        customAd: { ...adConfig.customAd, targetUrl: e.target.value },
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
                <Input
                  label="Media URL (Image or Video)"
                  value={adConfig.customAd.mediaUrl}
                  onChange={(e) =>
                    setAdConfig({
                      ...adConfig,
                      customAd: { ...adConfig.customAd, mediaUrl: e.target.value },
                    })
                  }
                  placeholder="https://... (jpg, png, mp4)"
                />
              </div>

              <Button type="submit" className="w-full" variant="secondary" loading={submitting} disabled={submitting}>
                Save Custom Ad
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  )
}
