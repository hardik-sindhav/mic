import { API_BASE_URL } from '../config/env.js'

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data
}

export async function fetchAllTicketsAdmin(token, status = '') {
  const url = status ? `${API_BASE_URL}/api/support/admin?status=${status}` : `${API_BASE_URL}/api/support/admin`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return handleResponse(res)
}

export async function fetchTicketDetail(token, id) {
  const res = await fetch(`${API_BASE_URL}/api/support/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return handleResponse(res)
}

export async function updateTicketStatusAdmin(token, id, status, solution = '') {
  const res = await fetch(`${API_BASE_URL}/api/support/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status, solution })
  })
  return handleResponse(res)
}

export async function postTicketReply(token, id, message, images = []) {
  const formData = new FormData()
  formData.append('message', message)
  
  images.forEach(img => {
    formData.append('images', img)
  })

  const res = await fetch(`${API_BASE_URL}/api/support/${id}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
  return handleResponse(res)
}
