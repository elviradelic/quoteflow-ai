
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Shared helper for communicating with the FastAPI backend.
 */
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

  // DELETE can return 204 No Content.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ---------------------------------
// HEALTH CHECK
// ---------------------------------

export function checkBackendHealth() {
  return apiRequest("/health");
}

// ---------------------------------
// QUOTE PREVIEW
// ---------------------------------

export function previewQuote(quoteData) {
  return apiRequest("/api/quotes/preview", {
    method: "POST",
    body: JSON.stringify(quoteData),
  });
}

// ---------------------------------
// CREATE QUOTE
// ---------------------------------

export function createQuote(quoteData) {
  return apiRequest("/api/quotes", {
    method: "POST",
    body: JSON.stringify(quoteData),
  });
}

// ---------------------------------
// GET ALL QUOTES
// ---------------------------------

export function getQuotes() {
  return apiRequest("/api/quotes");
}

// ---------------------------------
// GET QUOTE BY ID
// ---------------------------------

export function getQuoteById(quoteId) {
  return apiRequest(`/api/quotes/${quoteId}`);
}

// Alias used by QuoteEditor.
export function getQuote(quoteId) {
  return getQuoteById(quoteId);
}

// ---------------------------------
// UPDATE QUOTE
// ---------------------------------

export function updateQuote(quoteId, quoteData) {
  return apiRequest(`/api/quotes/${quoteId}`, {
    method: "PUT",
    body: JSON.stringify(quoteData),
  });
}

// ---------------------------------
// UPDATE QUOTE STATUS
// ---------------------------------

export function updateQuoteStatus(quoteId, status) {
  return apiRequest(`/api/quotes/${quoteId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------
// DELETE QUOTE
// ---------------------------------

export function deleteQuote(quoteId) {
  return apiRequest(`/api/quotes/${quoteId}`, {
    method: "DELETE",
  });
}


export async function downloadQuotePdf(quoteId) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/quotes/${quoteId}/pdf`
  );

  if (!response.ok) {
    throw new Error("Unable to download quote PDF.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `Quote-QT-${String(quoteId).padStart(3, "0")}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
