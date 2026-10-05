import apiClient from "./apiClient";

/** Authenticates a web user and returns the JWT login response from the API. */
export async function loginUser(credentials) {
  const response = await apiClient.post("/Auth/login", credentials);
  return response.data;
}
