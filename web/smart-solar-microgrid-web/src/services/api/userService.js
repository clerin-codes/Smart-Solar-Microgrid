import apiClient from './apiClient'

export const getUsers = async () => (await apiClient.get('/Users')).data
export const activateUser = async (nic) => (await apiClient.post(`/Users/${nic}/activate`)).data
export const deactivateUser = async (nic) => (await apiClient.delete(`/Users/${nic}`)).data
export const reactivateUser = async (nic) => (await apiClient.post(`/Users/${nic}/reactivate`)).data
