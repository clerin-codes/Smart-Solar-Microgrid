import apiClient from "./apiClient";

/** Returns the authenticated web user's current account profile. */
export async function getMyProfile() {
  const response = await apiClient.get("/Account/me");
  return response.data;
}

/** Updates only the editable fields of the authenticated web user's profile. */
export async function updateMyProfile(payload) {
  const response = await apiClient.put("/Account/me", payload);
  return response.data;
}

/** Changes the authenticated user's password after server-side verification. */
export async function changeMyPassword(payload) {
  const response = await apiClient.post("/Account/change-password", payload);
  return response.data;
}
