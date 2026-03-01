export async function cfApi(token: string, endpoint: string, method: string = 'GET', body?: any) {
  const baseUrl = 'https://api.cloudflare.com/client/v4';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(`CF API Error: ${data.errors?.[0]?.message || response.statusText}`);
  }
  return data;
}
