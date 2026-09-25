const BASE = 'http://localhost:5000/api';

const headers = () => {
  const token = localStorage.getItem('earts_token');
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
};

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    return text;
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  get: (path) => req('GET', path),
  post: (path, body) => req('POST', path, body),
  patch: (path, body) => req('PATCH', path, body),
  delete: (path) => req('DELETE', path),
};
