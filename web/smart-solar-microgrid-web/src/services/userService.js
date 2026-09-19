import apiClient from './apiClient'

export const userService = {
  getAll: () => apiClient.get('/users').then((r) => r.data),
  getByNic: (nic) => apiClient.get(`/users/${nic}`).then((r) => r.data),
  create: (data) => apiClient.post('/users', data).then((r) => r.data),
  update: (nic, data) => apiClient.put(`/users/${nic}`, data).then((r) => r.data),
  deactivate: (nic) => apiClient.delete(`/users/${nic}`).then((r) => r.data),
  reactivate: (nic) => apiClient.post(`/users/${nic}/reactivate`).then((r) => r.data),
}
