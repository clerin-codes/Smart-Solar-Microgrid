import apiClient from './apiClient'

export const getAllStations = async () => {
  const response = await apiClient.get('/Stations')
  return response.data
}

export const getStationById = async (id) => {
  const response = await apiClient.get(`/Stations/${id}`)
  return response.data
}

export const createStation = async (stationData) => {
  const response = await apiClient.post(
    '/Stations',
    stationData
  )

  return response.data
}

export const updateStation = async (id, stationData) => {
  const response = await apiClient.put(
    `/Stations/${id}`,
    stationData
  )

  return response.data
}

export const deactivateStation = async (id) => {
  const response = await apiClient.delete(
    `/Stations/${id}`
  )

  return response.data
}
