export const AUTH_EXPIRED_EVENT = "stockvision:auth-expired";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function request(url, options = {}, notifyUnauthorized = true) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes((options.method || "GET").toUpperCase())) {
    // Fetch a current token: login and logout rotate the session's CSRF token.
    const csrf = await request("/api/auth/csrf", {}, false);
    headers.set(csrf.headerName, csrf.token);
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers, credentials: "same-origin" });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && notifyUnauthorized) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    const body = response.headers.get("content-type")?.includes("json")
      ? await response.json().catch(() => null)
      : null;
    throw new ApiError(body?.detail || body?.message || "Não foi possível concluir a solicitação.", response.status);
  }
  return response.status === 204 ? null : response.json();
}
