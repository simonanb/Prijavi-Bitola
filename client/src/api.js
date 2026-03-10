const BASE = '/api';

async function json(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getReports = (sort = 'newest') =>
  fetch(`${BASE}/reports?sort=${sort}`).then(json);

export const submitReport = (formData) =>
  fetch(`${BASE}/reports`, { method: 'POST', body: formData }).then(json);

export const upvoteReport = (id) =>
  fetch(`${BASE}/reports/${id}/upvote`, { method: 'POST' }).then(json);

export const updateStatus = (id, status) =>
  fetch(`${BASE}/reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(json);

export const deleteReport = (id) =>
  fetch(`${BASE}/reports/${id}`, { method: 'DELETE' }).then(json);
