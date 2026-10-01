import apiClient from './apiClient'

export const login = async (nic, password) => {
  const response = await apiClient.post('/Auth/login', { nic, password })
  return response.data
}

export const getProfile = async () => {
  const response = await apiClient.get('/Auth/profile')
  return response.data
}
