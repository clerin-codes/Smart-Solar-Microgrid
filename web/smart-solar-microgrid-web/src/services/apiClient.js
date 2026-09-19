import axios from 'axios'

export const TOKEN_KEY = 'authToken'
export const USER_KEY = 'authUser'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5130/api',
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// The API also answers 401 with a JSON message for business-rule errors, so only an
// empty-bodied 401 (rejected or expired JWT) ends the session.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error
    const isLogin = error.config?.url?.includes('/auth/login')
    if (response?.status === 401 && !isLogin && !response.data?.message) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default apiClient
