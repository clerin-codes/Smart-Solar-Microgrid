import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:5130/api',
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
          'http://localhost:5130/api/Auth/login',
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