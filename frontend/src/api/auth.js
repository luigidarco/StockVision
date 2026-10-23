import { request } from "./http";

export function getCurrentUser(signal) {
  return request("/api/auth/me", { signal }, false);
}

export async function login(email, password) {
  await request("/api/auth/login", {
    method: "POST",
    body: new URLSearchParams({ email: email.trim(), password }),
  }, false);
  return getCurrentUser();
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}
