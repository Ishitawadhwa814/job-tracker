const BASE_URL = "https://job-tracker-6j9b.onrender.com/api/interviews";

async function handleResponse(res) {
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const interviewsApi = {
  async list(userId) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}`);
    return handleResponse(res);
  },

  async create(userId, interview) {
    const url = `${BASE_URL}/${encodeURIComponent(userId)}`;
    try { console.debug('[interviewsApi.create] POST', url, interview); } catch (_) {}
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interview),
    });
    return handleResponse(res);
  },

  async update(userId, id, updates) {
    const url = `${BASE_URL}/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`;
    try { console.debug('[interviewsApi.update] PATCH', url, updates); } catch (_) {}
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async remove(userId, id) {
    const url = `${BASE_URL}/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`;
    try { console.debug('[interviewsApi.remove] DELETE', url); } catch (_) {}
    const res = await fetch(url, {
      method: 'DELETE',
    });
    return handleResponse(res);
  }
};
