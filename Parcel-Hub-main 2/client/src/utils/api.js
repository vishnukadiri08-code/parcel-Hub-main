const BASE_URL = '';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cph_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('cph_auth_token');
    localStorage.removeItem('cph_auth_user');
    window.dispatchEvent(new CustomEvent('cph:unauthorized'));
    throw new Error('Session expired or unauthorized. Please re-authenticate.');
  }

  // Handle binary blob responses (e.g., Excel downloads)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('spreadsheetml')) {
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to download report.');
    }
    return response.blob();
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'A command center server error occurred.');
  }

  return data;
}

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  download: async (url, fallbackFilename = 'report.xlsx') => {
    const token = localStorage.getItem('cph_auth_token');
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to download file.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fallbackFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  }
};
