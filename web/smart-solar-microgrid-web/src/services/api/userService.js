import apiClient from "./apiClient";

export async function getUsers(filters = {}) {
  const params = {};

  if (filters.role) {
    params.role = filters.role;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  const response = await apiClient.get("/Users", { params });

  return response.data;
}

export async function getUserByNic(nic) {
  const response = await apiClient.get(`/Users/${encodeURIComponent(nic)}`);

  return response.data;
}

export async function createUser(userData) {
  const response = await apiClient.post("/Users", userData);

  return response.data;
}

export async function updateUser(nic, userData) {
  const response = await apiClient.put(
    `/Users/${encodeURIComponent(nic)}`,
    userData,
  );

  return response.data;
}

export async function getPendingActivations() {
  const response = await apiClient.get("/Users/pending-activations");

  return response.data;
}

export async function getDeactivationRequests() {
  const response = await apiClient.get("/Users/deactivation-requests");

  return response.data;
}

export async function activateUser(nic) {
  const response = await apiClient.post(
    `/Users/${encodeURIComponent(nic)}/activate`,
  );

  return response.data?.user ?? response.data;
}

export async function deactivateUser(nic) {
  const response = await apiClient.delete(`/Users/${encodeURIComponent(nic)}`);

  return response.data?.user ?? response.data;
}

export async function reactivateUser(nic) {
  const response = await apiClient.post(
    `/Users/${encodeURIComponent(nic)}/reactivate`,
  );

  return response.data?.user ?? response.data;
}
