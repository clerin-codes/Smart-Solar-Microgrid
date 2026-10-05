import apiClient from "./apiClient";

/**
 * Authenticates a user using NIC and password.
 *
 * @param {{ nic: string, password: string }} credentials
 * @returns {Promise<object>} JWT authentication response from the API.
 */
export async function loginUser(credentials) {
  const response = await apiClient.post("/Auth/login", credentials);
  return response.data;
}

/**
 * Backward-compatible login helper.
 * Can be removed later if no frontend file imports `login`.
 *
 * @param {string} nic
 * @param {string} password
 * @returns {Promise<object>} JWT authentication response from the API.
 */
export async function login(nic, password) {
  return loginUser({
    nic,
    password,
  });
}
