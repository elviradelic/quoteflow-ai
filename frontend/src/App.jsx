
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  MoreHorizontal,
  RefreshCw,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Download,
} from "lucide-react";

import QuoteEditor from "./components/QuoteEditor";

import {
  getQuotes,
  deleteQuote,
  updateQuoteStatus,
  downloadQuotePdf,
} from "./services/api";

import "./App.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Quotes", icon: FileText },
  { name: "Invoices", icon: Receipt },
  { name: "Clients", icon: Users },
  { name: "Settings", icon: Settings },
];

const quoteStatuses = ["Draft", "Pending", "Accepted"];

function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>

        <div className="stat-icon">
          <Icon size={19} />
        </div>
      </div>

      <h2>{value}</h2>

      <div className="stat-bottom">
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [busyQuoteId, setBusyQuoteId] = useState(null);

  const menuRef = useRef(null);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch (err) {
      setError(
        err.message || "Unable to load quotes from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function navigate(destination) {
    setPage(destination);
    setSidebarOpen(false);
    setOpenMenuId(null);
  }

  function openQuoteEditor() {
    setSelectedQuoteId(null);
    setPage("Create Quote");
    setSidebarOpen(false);
    setOpenMenuId(null);
  }

  function editQuote(quoteId) {
    setSelectedQuoteId(quoteId);
    setPage("Edit Quote");
    setOpenMenuId(null);
    setSidebarOpen(false);
  }

  async function handleQuoteSaved() {
    await loadQuotes();
    setSelectedQuoteId(null);
    setPage("Quotes");
  }

  async function handleDeleteQuote(quote) {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete quote QT-${String(
        quote.id
      ).padStart(3, "0")} for ${quote.client_name}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setBusyQuoteId(quote.id);
    setError("");

    try {
      await deleteQuote(quote.id);
      await loadQuotes();
    } catch (err) {
      setError(err.message || "Unable to delete quote.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  async function handleStatusChange(quoteId, status) {
    setOpenMenuId(null);
    setBusyQuoteId(quoteId);
    setError("");

    try {
      await updateQuoteStatus(quoteId, status);
      await loadQuotes();
    } catch (err) {
      setError(err.message || "Unable to update quote status.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  async function handleDownloadPdf(quoteId) {
    setOpenMenuId(null);
    setBusyQuoteId(quoteId);
    setError("");

    try {
      await downloadQuotePdf(quoteId);
    } catch (err) {
      setError(err.message || "Unable to download PDF.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  const filteredQuotes = quotes.filter((quote) => {
    const query = search.trim().toLowerCase();

    return (
      (quote.client_name || "").toLowerCase().includes(query) ||
      (quote.project_name || "").toLowerCase().includes(query) ||
      String(quote.id).includes(query)
    );
  });

  const acceptedQuotes = quotes.filter(
    (quote) => quote.status === "Accepted"
  );

  const pendingQuotes = quotes.filter(
    (quote) => quote.status === "Pending"
  );

  const draftQuotes = quotes.filter(
    (quote) => quote.status === "Draft"
  );

  const totalQuotes = quotes.length;

  const totalValueByCurrency = quotes.reduce((totals, quote) => {
    const currency = quote.currency || "USD";

    totals[currency] =
      (totals[currency] || 0) + Number(quote.subtotal || 0);

    return totals;
  }, {});

  const totalValueDisplay = Object.entries(totalValueByCurrency)
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" + ");

  const totalValue = totalValueDisplay || "$0.00";

  function renderQuoteActions(quote) {
    const isOpen = openMenuId === quote.id;
    const isBusy = busyQuoteId === quote.id;

    return (
      <div
        className="quote-action-wrap"
        ref={isOpen ? menuRef : null}
      >
        <button
          type="button"
          className="quote-menu-trigger"
          title="Quote actions"
          aria-label={`Actions for quote ${quote.id}`}
          aria-expanded={isOpen}
          disabled={isBusy}
          onClick={() =>
            setOpenMenuId(isOpen ? null : quote.id)
          }
        >
          {isBusy ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <MoreHorizontal size={19} />
          )}
        </button>

        {isOpen && (
          <div className="quote-action-menu">
            <button
              type="button"
              onClick={() => editQuote(quote.id)}
            >
              <Pencil size={15} />
              Edit quote
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPdf(quote.id)}
            >
              <Download size={15} />
              Download PDF
            </button>

            <div className="quote-menu-divider" />

            <div className="quote-menu-label">
              CHANGE STATUS
            </div>

            {quoteStatuses.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() =>
                  handleStatusChange(quote.id, status)
                }
                disabled={quote.status === status}
              >
                {quote.status === status ? (
                  <Check size={15} />
                ) : (
                  <span className="quote-menu-icon-space" />
                )}

                {status}
              </button>
            ))}

            <div className="quote-menu-divider" />

            <button
              type="button"
              className="quote-delete-action"
              onClick={() => handleDeleteQuote(quote)}
            >
              <Trash2 size={15} />
              Delete quote
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderQuoteTable() {
    return (
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Recent quotes</h3>
            <p>Manage your proposals and estimates.</p>
          </div>

          <div className="table-actions">
            <div className="search-box">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search quotes..."
              />
            </div>

            <button
              type="button"
              className="new-quote-btn"
              onClick={openQuoteEditor}
            >
              <Plus size={17} />
              New quote
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading quotes from PostgreSQL...
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="empty-state">
            {search
              ? "No quotes match your search."
              : "No quotes yet. Create your first quote!"}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="quotes-table">
              <thead>
                <tr>
                  <th>QUOTE</th>
                  <th>CLIENT</th>
                  <th>PROJECT</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="quote-id">
                      QT-{String(quote.id).padStart(3, "0")}
                    </td>

                    <td>{quote.client_name}</td>

                    <td>{quote.project_name}</td>

                    <td className="amount-cell">
                      {formatMoney(
                        quote.subtotal,
                        quote.currency
                      )}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${(
                          quote.status || "Draft"
                        ).toLowerCase()}`}
                      >
                        {quote.status || "Draft"}
                      </span>
                    </td>

                    <td>{formatDate(quote.created_at)}</td>

                    <td>
                      {renderQuoteActions(quote)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (
      page === "Create Quote" ||
      page === "Edit Quote"
    ) {
      return (
        <QuoteEditor
          key={selectedQuoteId ?? "new"}
          quoteId={selectedQuoteId}
          onBack={() => navigate("Quotes")}
          onSave={handleQuoteSaved}
        />
      );
    }

    if (page === "Dashboard") {
      return (
        <>
          <div className="page-heading">
            <div>
              <h1>Dashboard</h1>
              <p>
                Welcome back! Here's what's happening
                with your business.
              </p>
            </div>

            <button
              type="button"
              className="new-quote-btn"
              onClick={openQuoteEditor}
            >
              <Plus size={17} />
              Create quote
            </button>
          </div>

          <div className="stats-grid">
            <StatCard
              title="Total Quotes"
              value={totalQuotes}
              icon={FileText}
              subtitle="Saved in PostgreSQL"
            />

            <StatCard
              title="Total Quote Value"
              value={totalValue}
              icon={ArrowUpRight}
              subtitle="Across all saved quotes"
            />

            <StatCard
              title="Pending Quotes"
              value={pendingQuotes.length}
              icon={Clock3}
              subtitle="Awaiting client response"
            />

            <StatCard
              title="Accepted Quotes"
              value={acceptedQuotes.length}
              icon={CheckCircle2}
              subtitle={`${draftQuotes.length} drafts saved`}
            />
          </div>

          <div className="promo-banner">
            <div>
              <div className="promo-tag">
                <Sparkles size={15} />
                QUOTEFLOW AI
              </div>

              <h2>
                Create professional quotes
                <br />
                in minutes.
              </h2>

              <p>
                Build, preview and save proposals
                for your clients.
              </p>

              <button
                type="button"
                onClick={openQuoteEditor}
                className="promo-button"
              >
                Create a quote
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="promo-decoration">
              <FileText size={95} />
            </div>
          </div>

          {renderQuoteTable()}
        </>
      );
    }

    if (page === "Quotes") {
      return (
        <>
          <div className="page-heading">
            <div>
              <h1>Quotes</h1>
              <p>
                All your saved proposals in one place.
              </p>
            </div>

            <button
              type="button"
              className="new-quote-btn"
              onClick={openQuoteEditor}
            >
              <Plus size={17} />
              Create quote
            </button>
          </div>

          {renderQuoteTable()}
        </>
      );
    }

    return (
      <div className="placeholder-page">
        <h1>{page}</h1>
        <p>We're building this module next.</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="sidebar-logo">
          <div className="logo-icon">
            <FileText size={23} />
          </div>

          <span>
            QuoteFlow <strong>AI</strong>
          </span>

          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(({ name, icon: Icon }) => (
            <button
              type="button"
              key={name}
              className={`nav-item ${
                page === name ||
                (
                  name === "Quotes" &&
                  (
                    page === "Create Quote" ||
                    page === "Edit Quote"
                  )
                )
                  ? "active"
                  : ""
              }`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <Sparkles size={19} />
            <strong>Work smarter</strong>
            <p>
              Your proposals, organized
              and ready to grow.
            </p>
          </div>

          <div className="sidebar-profile">
            <div className="avatar">Q</div>

            <div>
              <strong>QuoteFlow Workspace</strong>
              <small>Development mode</small>
            </div>

            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <span className="breadcrumb">
              Workspace / {page}
            </span>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="icon-button"
              title="Refresh quotes"
              onClick={loadQuotes}
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="topbar-avatar">
              Q
            </div>
          </div>
        </header>

        <div className="content-area">
          {error && (
            <div className="editor-error">
              {error}
            </div>
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
