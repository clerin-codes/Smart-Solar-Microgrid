import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured')
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('accessToken')

    // DEV ONLY: Auto login if no token and not trying to login
    if (!token && !config.url.includes('/Auth/login')) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/Auth/login`,
          {
            nic: '200000000001',
            password: 'Admin@123',
          }
        )
        token = response.data.token
        localStorage.setItem('accessToken', token)
        console.log('DEV: Auto-logged in as Backoffice Admin')
      } catch (e) {
        console.error('DEV: Auto-login failed', e)
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient
