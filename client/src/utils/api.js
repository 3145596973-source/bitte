const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('bitte_token') || ''
}

function buildHeaders(extra = {}) {
  const headers = { ...extra }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request(url, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options

  const isFormData = restOptions.body instanceof FormData
  const headers = buildHeaders(
    isFormData ? extraHeaders : { 'Content-Type': 'application/json', ...extraHeaders }
  )

  const res = await fetch(`${BASE_URL}${url}`, {
    ...restOptions,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    const error = new Error(data.error || '请求失败')
    error.status = res.status
    error.data = data

    // Token 过期自动清除
    if (res.status === 401) {
      localStorage.removeItem('bitte_token')
    }

    throw error
  }

  return data
}

export const api = {
  get: (url) => request(url),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) => request(url, { method: 'POST', body: formData }),
}

export default api
