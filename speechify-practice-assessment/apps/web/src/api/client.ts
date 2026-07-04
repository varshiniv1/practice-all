const API_BASE = "http://localhost:4000";

const ANALYTICS_API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY ?? "";

export async function fetchPosts(filter?: string) {
  const url = filter
    ? `${API_BASE}/posts?filter=${filter}`
    : `${API_BASE}/posts`;
  const res = await fetch(url);
  // No status check -- a 4xx/5xx body still gets parsed and returned as
  // if it were a valid post list.
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
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
  return res.json();
}

export function trackEvent(name: string, payload: Record<string, unknown>) {
  fetch(`${API_BASE}/analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Analytics-Key": ANALYTICS_API_KEY,
    },
    body: JSON.stringify({ name, payload }),
  });
}
