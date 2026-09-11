export const API_BASE_URL = 'https://api.hlx.page';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export async function apiFetch(
  endpoint,
  {
    baseUrl = API_BASE_URL,
    method = 'GET',
    headers = {},
    body,
    ...options
  } = {},
) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    ...(body !== undefined && {
      body:
                typeof body === 'string'
                  ? body
                  : JSON.stringify(body),
    }),
    ...options,
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  // Handles APIs that return 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
