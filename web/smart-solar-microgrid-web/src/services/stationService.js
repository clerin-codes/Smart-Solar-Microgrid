import apiClient from './apiClient'

export const stationService = {
  getAll: () => apiClient.get('/stations').then((r) => r.data),
  getById: (id) => apiClient.get(`/stations/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/stations', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/stations/${id}`, data).then((r) => r.data),
  deactivate: (id) => apiClient.delete(`/stations/${id}`).then((r) => r.data),
}

export const slotService = {
  getAll: () => apiClient.get('/slots').then((r) => r.data),
  getByStation: (stationId) => apiClient.get(`/slots/station/${stationId}`).then((r) => r.data),
  create: (data) => apiClient.post('/slots', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/slots/${id}`, data).then((r) => r.data),
}
