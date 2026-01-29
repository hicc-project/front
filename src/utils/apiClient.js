// src/utils/apiClient.js
// fetch 래퍼: Authorization 자동 첨부

export const API_BASE = "https://back-r4e1.onrender.com";

export async function apiFetch(path, { token, ...init } = {}) {
  const headers = new Headers(init.headers || {});
  // JSON 바디면 Content-Type 자동
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.message || data?.detail || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
