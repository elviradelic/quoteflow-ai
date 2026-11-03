
const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    const message = error?.detail
      ? typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail)
      : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return response.json();
}

export function checkBackendHealth() {
  return apiRequest("/health");
}

export function previewQuote(quoteData) {
  return apiRequest("/api/quotes/preview", {
    method: "POST",
    body: JSON.stringify(quoteData),
  });
}

export function createQuote(quoteData) {
  return apiRequest("/api/quotes", {
    method: "POST",
    body: JSON.stringify(quoteData),
  });
}

export function getQuotes() {
  return apiRequest("/api/quotes");
}

export function getQuoteById(quoteId) {
  return apiRequest(`/api/quotes/${quoteId}`);
}
