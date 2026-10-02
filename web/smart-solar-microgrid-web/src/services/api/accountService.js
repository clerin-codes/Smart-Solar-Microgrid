import apiClient from "./apiClient";

export async function getMyProfile() {
  const response = await apiClient.get("/Account/me");

  return response.data;
}

export async function updateMyProfile(profile) {
  const response = await apiClient.put("/Account/me", profile);

  return response.data;
}
