import apiClient from "./apiClient";

export async function loginUser(credentials) {
  const response = await apiClient.post("/Auth/login", credentials);

  return response.data;
}
