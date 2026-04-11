import { API_BASE_URL } from '../config/env.js'

/** AD CONFIG API **/

export async function fetchAdConfig(accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/ads/config`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to load ad config')
    err.status = res.status
    throw err
  }
  return data
}

export async function updateAdConfig(accessToken, payload) {
  const res = await fetch(`${API_BASE_URL}/api/ads/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to update ad config')
    err.status = res.status
    throw err
  }
  return data
}

/** APP SETTINGS API **/

export async function fetchAppSettings(accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/app-settings`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to load app settings')
    err.status = res.status
    throw err
  }
  return data
}

export async function updateAppSettings(accessToken, payload) {
  const res = await fetch(`${API_BASE_URL}/api/app-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to update app settings')
    err.status = res.status
    throw err
  }
  return data
}
