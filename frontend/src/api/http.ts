import axios from 'axios'
import {clearLoginInfo, readLoginInfo} from './session'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true
})

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data

    if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      const message = responseData.message

      if (typeof message === 'string' && message.trim()) {
        return message
      }
    }

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData
    }

    if (error.message) {
      return error.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

http.interceptors.response.use(
    response => response,
    error => {
      const isLoginRequest = axios.isAxiosError(error) && error.config?.url?.endsWith('/auth/portal/login')

      if (axios.isAxiosError(error) && error.response?.status === 401 && !isLoginRequest) {
        clearLoginInfo()

        if (window.location.pathname !== '/login') {
          const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
          window.location.assign(`/login?redirect=${encodeURIComponent(currentPath)}`)
        }
      }

      return Promise.reject(error)
    }
)

http.interceptors.request.use(request => {
  const accessToken = readLoginInfo()?.accessToken
  if (accessToken && !request.headers.Authorization) {
    request.headers.Authorization = `Bearer ${accessToken}`
  }
  return request
})

export default http