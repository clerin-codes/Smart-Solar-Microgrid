import apiClient from "./apiClient";

/** Returns the Backoffice user-management list with optional server filters. */
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

/** Creates a Backoffice or Grid Operator web account. */
export async function createUser(userData) {
  const response = await apiClient.post("/Users", userData);
  return response.data;
}

/** Updates editable profile details for a managed account. */
export async function updateUser(nic, userData) {
  const response = await apiClient.put(
    `/Users/${encodeURIComponent(nic)}`,
    userData,
  );

  return response.data;
}

/** Returns Prosumer accounts waiting for Backoffice activation. */
export async function getPendingActivations() {
  const response = await apiClient.get("/Users/pending-activations");
  return response.data;
}

/** Returns Prosumer accounts waiting for deactivation finalization. */
export async function getDeactivationRequests() {
  const response = await apiClient.get("/Users/deactivation-requests");
  return response.data;
}

/** Activates a pending Prosumer account. */
export async function activateUser(nic) {
  const response = await apiClient.post(
    `/Users/${encodeURIComponent(nic)}/activate`,
  );

  return response.data?.user ?? response.data;
}

/** Deactivates an active account or finalizes a Prosumer deactivation request. */
export async function deactivateUser(nic) {
  const response = await apiClient.delete(`/Users/${encodeURIComponent(nic)}`);

  return response.data?.user ?? response.data;
}

/** Reactivates a previously deactivated account. */
export async function reactivateUser(nic) {
  const response = await apiClient.post(
    `/Users/${encodeURIComponent(nic)}/reactivate`,
  );

  return response.data?.user ?? response.data;
}
