
const API_BASE_URL = "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable.");
  }

  return response.json();
}

export async function previewQuote(quoteData) {
  const response = await fetch(
    `${API_BASE_URL}/api/quotes/preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteData),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail
        ? JSON.stringify(error.detail)
        : "Unable to generate quote preview."
    );
  }

  return response.json();
}
