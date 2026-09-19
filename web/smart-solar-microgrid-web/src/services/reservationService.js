import apiClient from './apiClient'

export const reservationService = {
  getAll: () => apiClient.get('/reservations').then((r) => r.data),
  getById: (id) => apiClient.get(`/reservations/${id}`).then((r) => r.data),
  approve: (id) => apiClient.post(`/reservations/${id}/approve`).then((r) => r.data),
  // The endpoint takes a bare JSON string body.
  verifyQr: (token) =>
    apiClient
      .post('/reservations/verify-qr', JSON.stringify(token), {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((r) => r.data),
  complete: (id) => apiClient.post(`/reservations/${id}/complete`).then((r) => r.data),
}
