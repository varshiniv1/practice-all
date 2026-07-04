const API_BASE = "http://localhost:4000";

const ANALYTICS_API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY ?? "";

export async function fetchPosts(filter?: string) {
  const url = filter
    ? `${API_BASE}/posts?filter=${filter}`
    : `${API_BASE}/posts`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function toggleBookmark(postId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/posts/${postId}/bookmark`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data;
}

export function trackEvent(name: string, payload: Record<string, unknown>): Promise<void> {
  return fetch(`${API_BASE}/analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Analytics-Key": ANALYTICS_API_KEY,
    },
    body: JSON.stringify({ name, payload }),
  })
    .then(() => undefined)
    .catch(() => undefined);
}
