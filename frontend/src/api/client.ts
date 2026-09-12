import axios from 'axios'

const resolvedBaseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export const apiClient = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 60000,
})

export default apiClient
