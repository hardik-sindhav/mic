import { API_BASE_URL } from '../config/env.js'

/** AD NETWORK CONFIG API (Ad Manager) **/

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

/** CUSTOM ADS API (Multiple Ads) **/

export async function fetchCustomAdsAdmin(accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/custom-ads/admin`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await res.json().catch(() => ([]))
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to load custom ads')
    err.status = res.status
    throw err
  }
  return data
}

export async function createCustomAd(accessToken, payload) {
  const res = await fetch(`${API_BASE_URL}/api/custom-ads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create custom ad')
  }
  return data
}

export async function updateCustomAd(accessToken, id, payload) {
  const res = await fetch(`${API_BASE_URL}/api/custom-ads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update custom ad')
  }
  return data
}

export async function deleteCustomAd(accessToken, id) {
  const res = await fetch(`${API_BASE_URL}/api/custom-ads/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    throw new Error('Failed to delete custom ad')
  }
  return true
}

export async function reorderCustomAds(accessToken, idOrderArray) {
  const res = await fetch(`${API_BASE_URL}/api/custom-ads/order`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ order: idOrderArray }),
  })
  if (!res.ok) {
    throw new Error('Failed to reorder custom ads')
  }
  return res.json()
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
