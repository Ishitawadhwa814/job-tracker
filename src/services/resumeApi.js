const BASE_URL = "http://localhost:5000/api/resume";

async function handleResponse(res) {
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const resumeApi = {
  async get(userId) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}`);
    return handleResponse(res);
  },
  async save(userId, resume) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume),
    });
    return handleResponse(res);
  }
};
