import { API_BASE_URL } from '../config/env.js'

export async function fetchUsers(accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load users')
  }
  return data
}

export async function deleteUser(accessToken, id) {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to delete user')
  }
  return true
}

export async function toggleBlockUser(accessToken, id, blockReason = '') {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}/toggle-block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ blockReason }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle block status')
  }
  return data
}

export async function updateUserProfileAdmin(accessToken, id, payload) {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update user')
  }
  return data
}
