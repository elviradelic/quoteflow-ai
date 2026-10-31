
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, FileCheck2, Loader2 } from "lucide-react";
import { previewQuote } from "../services/api";
import "./QuoteEditor.css";

const newItem = () => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: "1",
  unit_price: "0",
});

export default function QuoteEditor({ onBack, onSave }) {
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState([newItem()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const formatMoney = value =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(value) || 0);

  const total = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );

  function updateItem(id, field, value) {
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setResult(null);
  }

  function addItem() {
    setItems(current => [...current, newItem()]);
    setResult(null);
  }

  function removeItem(id) {
    if (items.length === 1) return;
    setItems(current => current.filter(item => item.id !== id));
    setResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const payload = {
      client_name: clientName.trim(),
      currency,
      items: items.map(({ description, quantity, unit_price }) => ({
        description: description.trim(),
        quantity: String(quantity),
        unit_price: String(unit_price),
      })),
    };

    setLoading(true);

    try {
      const data = await previewQuote(payload);
      setResult(data);
      onSave?.({
        ...data,
        project_name: projectName.trim(),
      });
    } catch (err) {
      setError(err.message || "Unable to preview quote.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="quote-editor">
      <button className="editor-back" type="button" onClick={onBack}>
        <ArrowLeft size={17} /> Back to Quotes
      </button>

      <div className="editor-heading">
        <div>
          <span className="editor-eyebrow">QUOTEFLOW AI / QUOTES</span>
          <h1>Create a new quote</h1>
          <p>Build a professional proposal for your client.</p>
        </div>
        <span className="editor-draft">Draft</span>
      </div>

      <div className="editor-layout">
        <form className="editor-panel" onSubmit={handleSubmit}>
          <div className="editor-section">
            <h2>Client information</h2>
            <p>Who are you preparing this quote for?</p>

            <label htmlFor="client-name">Client name *</label>
            <input
              id="client-name"
              required
              value={clientName}
              onChange={e => {
                setClientName(e.target.value);
                setResult(null);
              }}
              placeholder="e.g. Acme Studio"
            />

            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Website redesign"
            />

            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={e => {
                setCurrency(e.target.value);
                setResult(null);
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
                <p>Add the services included in your proposal.</p>
              </div>
              <button type="button" className="editor-add" onClick={addItem}>
                <Plus size={16} /> Add item
              </button>
            </div>

            {items.map((item, index) => (
              <div className="editor-item" key={item.id}>
                <div className="editor-item-title">
                  <strong>Item {index + 1}</strong>
                  <button
                    type="button"
                    aria-label="Remove item"
                    disabled={items.length === 1}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <label>Description *</label>
                <input
                  required
                  minLength={1}
                  value={item.description}
                  onChange={e =>
                    updateItem(item.id, "description", e.target.value)
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
                      onChange={e =>
                        updateItem(item.id, "quantity", e.target.value)
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
                      onChange={e =>
                        updateItem(item.id, "unit_price", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="editor-error" role="alert">{error}</div>}

          {result && (
            <div className="editor-success" role="status">
              <FileCheck2 size={18} />
              Quote successfully validated by FastAPI.
            </div>
          )}

          <button className="editor-submit" disabled={loading} type="submit">
            {loading ? <Loader2 size={18} /> : <FileCheck2 size={18} />}
            {loading ? "Generating preview..." : "Generate Quote Preview"}
          </button>
        </form>

        <aside className="editor-preview">
          <div className="preview-top">
            <span>LIVE PREVIEW</span>
            <span>QUOTE</span>
          </div>
          <div className="preview-brand">QuoteFlow<span>AI</span></div>
          <h2>Quotation</h2>
          <p className="preview-muted">
            {projectName || "Project proposal"}
          </p>

          <div className="preview-client">
            <span>PREPARED FOR</span>
            <strong>{clientName || "Client name"}</strong>
          </div>

          <div className="preview-items">
            <div className="preview-table-heading">
              <span>DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>
            {items.map(item => (
              <div className="preview-line" key={item.id}>
                <div>
                  <strong>{item.description || "Service description"}</strong>
                  <small>
                    {item.quantity || 0} × {formatMoney(item.unit_price)}
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
            <strong>{formatMoney(total)}</strong>
          </div>

          <p className="preview-note">
            Taxes and discounts are not included.
            Final amounts must be confirmed before sending.
          </p>

          {result && (
            <div className="preview-verified">
              <FileCheck2 size={16} />
              Backend verified: {formatMoney(result.subtotal)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
