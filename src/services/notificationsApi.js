const BASE_URL = "http://localhost:5000/api/notifications";

async function handleResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const notificationsApi = {
  async list(userId) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}`);
    return handleResponse(res);
  },

  async markRead(id) {
    const res = await fetch(`${BASE_URL}/read/${encodeURIComponent(id)}`, {
      method: "PUT",
    });
    return handleResponse(res);
  },

  async create({ userId, message, type }) {
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message, type }),
    });
    return handleResponse(res);
  },
};
