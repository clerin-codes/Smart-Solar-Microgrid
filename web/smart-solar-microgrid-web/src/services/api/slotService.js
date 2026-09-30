import apiClient from './apiClient'

export const getAllSlots = async () => {
    const response = await apiClient.get('/Slots')
    return response.data
}

export const getSlotById = async (id) => {
    const response = await apiClient.get(`/Slots/${id}`)
    return response.data
}

export const getSlotsByStation = async (stationId) => {
    const response = await apiClient.get(
        `/Slots/station/${stationId}`
    )

    return response.data
}

export const createSlot = async (slotData) => {
    const response = await apiClient.post(
        '/Slots',
        slotData
    )

    return response.data
}

export const updateSlot = async (id, slotData) => {
    const response = await apiClient.put(
        `/Slots/${id}`,
        slotData
    )

    return response.data
}
