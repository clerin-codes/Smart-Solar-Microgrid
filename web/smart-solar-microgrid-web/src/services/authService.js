import apiClient from './apiClient'

export const authService = {
  login: (nic, password) => apiClient.post('/auth/login', { nic, password }).then((r) => r.data),
}
