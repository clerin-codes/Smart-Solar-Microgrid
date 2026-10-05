export function normalizeFieldKey(key = "") {
  if (!key) {
    return key;
  }

  if (key.toUpperCase() === "NIC") {
    return "nic";
  }

  return key.charAt(0).toLowerCase() + key.slice(1);
}

export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.title) {
    return data.title;
  }

  if (
    error?.code === "ERR_NETWORK" ||
    (error?.isAxiosError && !error?.response)
  ) {
    return (
      "Unable to connect to the server. " +
      "Please make sure the API is running."
    );
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
}

export function getApiFieldErrors(error) {
  const apiErrors = error?.response?.data?.errors;

  if (!apiErrors || typeof apiErrors !== "object") {
    return {};
  }

  return Object.entries(apiErrors).reduce((result, [key, messages]) => {
    const normalizedKey = normalizeFieldKey(key);

    result[normalizedKey] = Array.isArray(messages)
      ? messages[0]
      : String(messages);

    return result;
  }, {});
}
