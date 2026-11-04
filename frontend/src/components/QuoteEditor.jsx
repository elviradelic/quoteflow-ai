
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileCheck2,
  Loader2,
  Save,
} from "lucide-react";

import {
  previewQuote,
  createQuote,
  getQuoteById,
  updateQuote,
} from "../services/api";

import "./QuoteEditor.css";

function newItem(item = {}) {
  return {
    id: crypto.randomUUID(),
    description: item.description ?? "",
    quantity: String(item.quantity ?? "1"),
    unit_price: String(item.unit_price ?? "0"),
  };
}

export default function QuoteEditor({
  onBack,
  onSave,
  quoteId = null,
}) {
  const isEditing = quoteId !== null && quoteId !== undefined;

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState([newItem()]);
  const [quoteStatus, setQuoteStatus] = useState("Draft");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(isEditing);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!isEditing) {
        setClientName("");
        setProjectName("");
        setCurrency("USD");
        setItems([newItem()]);
        setQuoteStatus("Draft");
        setError("");
        setResult(null);
        setLoadingQuote(false);
        return;
      }

      setLoadingQuote(true);
      setError("");
      setResult(null);

      try {
        const quote = await getQuoteById(quoteId);

        if (cancelled) return;

        setClientName(quote.client_name ?? "");
        setProjectName(quote.project_name ?? "");
        setCurrency(quote.currency ?? "USD");
        setQuoteStatus(quote.status ?? "Draft");

        setItems(
          quote.items?.length
            ? quote.items.map((item) => newItem(item))
            : [newItem()]
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load quote.");
        }
      } finally {
        if (!cancelled) {
          setLoadingQuote(false);
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [quoteId, isEditing]);

  const formatMoney = (value) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(Number(value) || 0);
    } catch {
      return `${currency} ${(Number(value) || 0).toFixed(2)}`;
    }
  };

  const total = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) *
        (Number(item.unit_price) || 0),
    0
  );

  function clearPreview() {
    setResult(null);
    setError("");
  }

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    clearPreview();
  }

  function addItem() {
    setItems((current) => [...current, newItem()]);
    clearPreview();
  }

  function removeItem(id) {
    if (items.length === 1) return;

    setItems((current) =>
      current.filter((item) => item.id !== id)
    );

    clearPreview();
  }

  function buildPayload() {
    return {
      client_name: clientName.trim(),
      project_name: projectName.trim() || "Untitled project",
      currency,
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
      })),
    };
  }

  function validateForm() {
    if (!clientName.trim()) {
      setError("Please enter a client name.");
      return false;
    }

    if (
      items.some((item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.unit_price);

        return (
          !item.description.trim() ||
          item.quantity === "" ||
          item.unit_price === "" ||
          !Number.isFinite(quantity) ||
          !Number.isFinite(price) ||
          quantity <= 0 ||
          price < 0 ||
          !/^\d+(\.\d{1,2})?$/.test(String(item.quantity)) ||
          !/^\d+(\.\d{1,2})?$/.test(String(item.unit_price)) ||
          quantity >= 10000000000 ||
          price >= 10000000000
        );
      })
    ) {
      setError(
        "Please enter valid descriptions, quantities and prices (up to two decimal places)."
      );
      return false;
    }

    return true;
  }

  async function handlePreview(event) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = await previewQuote(buildPayload());
      setResult(data);
    } catch (err) {
      setError(
        err.message || "Unable to generate quote preview."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError("");

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      const savedQuote = isEditing
        ? await updateQuote(quoteId, payload)
        : await createQuote(payload);

      onSave?.(savedQuote);
    } catch (err) {
      setError(
        err.message ||
          (isEditing
            ? "Unable to update quote."
            : "Unable to save quote.")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingQuote) {
    return (
      <div className="quote-editor">
        <button
          className="editor-back"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Quotes
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 40,
            color: "#777c90",
          }}
        >
          <Loader2 size={22} />
          Loading quote...
        </div>
      </div>
    );
  }

  return (
    <div className="quote-editor">
      <button
        className="editor-back"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to Quotes
      </button>

      <div className="editor-heading">
        <div>
          <span className="editor-eyebrow">
            QUOTEFLOW AI / QUOTES
          </span>

          <h1>
            {isEditing
              ? `Edit quote QT-${String(quoteId).padStart(3, "0")}`
              : "Create a new quote"}
          </h1>

          <p>
            {isEditing
              ? "Update the details of your existing proposal."
              : "Build a professional proposal for your client."}
          </p>
        </div>

        <span className="editor-draft">
          {quoteStatus}
        </span>
      </div>

      <div className="editor-layout">
        <form
          className="editor-panel"
          onSubmit={handlePreview}
        >
          <div className="editor-section">
            <h2>Client information</h2>

            <p>
              Who are you preparing this quote for?
            </p>

            <label htmlFor="client-name">
              Client name *
            </label>

            <input
              id="client-name"
              required
              maxLength={200}
              value={clientName}
              onChange={(event) => {
                setClientName(event.target.value);
                clearPreview();
              }}
              placeholder="e.g. Acme Studio"
            />

            <label htmlFor="project-name">
              Project name
            </label>

            <input
              id="project-name"
              maxLength={255}
              value={projectName}
              onChange={(event) => {
                setProjectName(event.target.value);
                clearPreview();
              }}
              placeholder="e.g. Website redesign"
            />

            <label htmlFor="currency">
              Currency
            </label>

            <select
              id="currency"
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value);
                clearPreview();
              }}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="BAM">BAM — Convertible Mark</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="AUD">AUD — Australian Dollar</option>
            </select>
          </div>

          <div className="editor-section">
            <div className="editor-section-top">
              <div>
                <h2>Services & pricing</h2>

                <p>
                  Add the services included in your proposal.
                </p>
              </div>

              <button
                type="button"
                className="editor-add"
                onClick={addItem}
                disabled={loading || saving}
              >
                <Plus size={16} />
                Add item
              </button>
            </div>

            {items.map((item, index) => (
              <div
                className="editor-item"
                key={item.id}
              >
                <div className="editor-item-title">
                  <strong>Item {index + 1}</strong>

                  <button
                    type="button"
                    aria-label="Remove item"
                    disabled={
                      items.length === 1 ||
                      loading ||
                      saving
                    }
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <label>Description *</label>

                <input
                  required
                  value={item.description}
                  onChange={(event) =>
                    updateItem(
                      item.id,
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Landing page design"
                />

                <div className="editor-item-grid">
                  <div>
                    <label>Quantity</label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "quantity",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>Unit price</label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.unit_price}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "unit_price",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              className="editor-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {result && (
            <div
              className="editor-success"
              role="status"
            >
              <FileCheck2 size={18} />
              Quote successfully validated by FastAPI.
            </div>
          )}

          <div className="editor-actions">
            <button
              className="editor-submit"
              type="submit"
              disabled={loading || saving}
            >
              {loading ? (
                <Loader2 size={18} />
              ) : (
                <FileCheck2 size={18} />
              )}

              {loading
                ? "Generating preview..."
                : "Generate Preview"}
            </button>

            <button
              className="editor-save"
              type="button"
              disabled={loading || saving}
              onClick={handleSave}
            >
              {saving ? (
                <Loader2 size={18} />
              ) : (
                <Save size={18} />
              )}

              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Quote"
                  : "Save Quote"}
            </button>
          </div>
        </form>

        <aside className="editor-preview">
          <div className="preview-top">
            <span>LIVE PREVIEW</span>
            <span>QUOTE</span>
          </div>

          <div className="preview-brand">
            QuoteFlow<span>AI</span>
          </div>

          <h2>Quotation</h2>

          <p className="preview-muted">
            {projectName || "Project proposal"}
          </p>

          <div className="preview-client">
            <span>PREPARED FOR</span>

            <strong>
              {clientName || "Client name"}
            </strong>
          </div>

          <div className="preview-items">
            <div className="preview-table-heading">
              <span>DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>

            {items.map((item) => (
              <div
                className="preview-line"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.description ||
                      "Service description"}
                  </strong>

                  <small>
                    {item.quantity || 0} ×{" "}
                    {formatMoney(item.unit_price)}
                  </small>
                </div>

                <strong>
                  {formatMoney(
                    (Number(item.quantity) || 0) *
                      (Number(item.unit_price) || 0)
                  )}
                </strong>
              </div>
            ))}
          </div>

          <div className="preview-total">
            <span>Estimated total</span>

            <strong>
              {formatMoney(total)}
            </strong>
          </div>

          <p className="preview-note">
            Taxes and discounts are not included.
            Final amounts must be confirmed before sending.
          </p>

          {result && (
            <div className="preview-verified">
              <FileCheck2 size={16} />
              Backend verified:{" "}
              {formatMoney(result.subtotal)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
