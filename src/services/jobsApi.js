const BASE_URL = "http://localhost:5000/api/jobs";

async function handleResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const jobsApi = {
  async getJobApplications(userId, favoritesOnly = false) {
    const url = favoritesOnly 
      ? `${BASE_URL}/${encodeURIComponent(userId)}?favoritesOnly=true`
      : `${BASE_URL}/${encodeURIComponent(userId)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async addJobApplication(userId, job) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    return handleResponse(res);
  },

  async updateJobApplication(userId, jobId, updates) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}/${encodeURIComponent(jobId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async toggleFavorite(userId, jobId, isFavorite) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}/${encodeURIComponent(jobId)}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite }),
    });
    return handleResponse(res);
  },

  async deleteJobApplication(userId, jobId) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(userId)}/${encodeURIComponent(jobId)}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};
