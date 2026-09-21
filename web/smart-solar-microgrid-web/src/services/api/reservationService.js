import apiClient from './apiClient'

export const getAllReservations = async () => {
  const response = await apiClient.get('/Reservations')
  return response.data
}

export const getReservationById = async (id) => {
  const response = await apiClient.get(`/Reservations/${id}`)
  return response.data
}

export const approveReservation = async (id) => {
  const response = await apiClient.post(
    `/Reservations/${id}/approve`
  )

  return response.data
}

export const getMyReservations = async () => {
  const response = await apiClient.get('/Reservations/my')
  return response.data
}

export const createReservation = async (reservationData) => {
  const response = await apiClient.post(
    '/Reservations',
    reservationData
  )

  return response.data
}

export const updateReservation = async (id, reservationData) => {
  const response = await apiClient.put(
    `/Reservations/${id}`,
    reservationData
  )

  return response.data
}

export const deleteReservation = async (id) => {
  const response = await apiClient.delete(
    `/Reservations/${id}`
  )

  return response.data
}