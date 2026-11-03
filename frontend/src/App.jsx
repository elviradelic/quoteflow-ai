
import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

import QuoteEditor from "./components/QuoteEditor";
import { getQuotes } from "./services/api";

import "./App.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Quotes", icon: FileText },
  { name: "Invoices", icon: Receipt },
  { name: "Clients", icon: Users },
  { name: "Settings", icon: Settings },
];

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount) || 0);
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

  function navigate(destination) {
    setPage(destination);
    setSidebarOpen(false);
  }

  function openQuoteEditor() {
    setPage("Create Quote");
    setSidebarOpen(false);
  }

  async function handleQuoteSaved() {
    await loadQuotes();
    setPage("Quotes");
  }

  const filteredQuotes = quotes.filter((quote) => {
    const query = search.toLowerCase();

    return (
      quote.client_name.toLowerCase().includes(query) ||
      quote.project_name.toLowerCase().includes(query) ||
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
    const currency = quote.currency;

    totals[currency] =
      (totals[currency] || 0) + Number(quote.subtotal);

    return totals;
  }, {});

  const totalValueDisplay = Object.entries(totalValueByCurrency)
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" + ");

  const totalValue = totalValueDisplay || "$0.00";

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
                  <th></th>
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
                        className={`status-badge ${quote.status.toLowerCase()}`}
                      >
                        {quote.status}
                      </span>
                    </td>

                    <td>{formatDate(quote.created_at)}</td>

                    <td>
                      <MoreHorizontal size={19} />
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
    if (page === "Create Quote") {
      return (
        <QuoteEditor
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
        <p>
          We're building this module next.
        </p>
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
              key={name}
              className={`nav-item ${
                page === name ? "active" : ""
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
              className="icon-button"
              title="Refresh quotes"
              onClick={loadQuotes}
            >
              <RefreshCw size={18} />
            </button>

            <button
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
