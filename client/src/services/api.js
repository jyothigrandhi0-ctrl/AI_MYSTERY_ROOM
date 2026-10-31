export async function api(path, options = {}) {
  let response;
  try { response = await fetch(`/api${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options }); }
  catch { throw new Error('Cannot reach the investigation server. Check that the backend is running.'); }
  const body = await response.json().catch(() => ({ error: 'The server returned an unexpected response.' }));
  if (!response.ok) throw new Error(body.error || 'Request failed. Please try again.');
  return body;
}
