
import { useState } from "react";
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
} from "lucide-react";

import QuoteEditor from "./components/QuoteEditor";
import "./App.css";

const initialQuotes = [
  {
    id: "QT-001",
    client: "Acme Studio",
    service: "Website redesign",
    amount: 2400,
    currency: "USD",
    status: "Accepted",
    date: "Oct 25, 2026",
  },
  {
    id: "QT-002",
    client: "Bright Media",
    service: "Brand identity",
    amount: 1850,
    currency: "USD",
    status: "Pending",
    date: "Oct 24, 2026",
  },
  {
    id: "QT-003",
    client: "Northstar Labs",
    service: "SEO consulting",
    amount: 950,
    currency: "USD",
    status: "Draft",
    date: "Oct 22, 2026",
  },
  {
    id: "QT-004",
    client: "Bloom Agency",
    service: "Social media package",
    amount: 1200,
    currency: "USD",
    status: "Accepted",
    date: "Oct 20, 2026",
  },
];

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Quotes", icon: FileText },
  { name: "Invoices", icon: Receipt },
  { name: "Clients", icon: Users },
  { name: "Settings", icon: Settings },
];

function App() {
  const [page, setPage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");

  const filteredQuotes = quotes.filter((quote) =>
    `${quote.client} ${quote.service} ${quote.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const accepted = quotes.filter(
    (quote) => quote.status === "Accepted"
  );

  const pending = quotes.filter(
    (quote) => quote.status === "Pending"
  );

  function money(value, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function createQuote() {
    setPage("QuoteEditor");
    setSidebarOpen(false);
  }

  function handleQuoteSave(data) {
    const nextNumber =
      quotes.reduce((max, quote) => {
        const number = Number(quote.id.replace("QT-", ""));
        return Math.max(max, Number.isFinite(number) ? number : 0);
      }, 0) + 1;

    const newQuote = {
      id: `QT-${String(nextNumber).padStart(3, "0")}`,
      client: data.client_name,
      service:
        data.project_name ||
        data.items?.[0]?.description ||
        "New project",
      amount: Number(data.subtotal),
      currency: data.currency || "USD",
      status: "Draft",
      date: new Date().toLocaleDateString("en-US"),
    };

    setQuotes((current) => [newQuote, ...current]);
  }

  function navigateTo(destination) {
    setPage(destination);
    setSidebarOpen(false);
  }

  const totalQuoteValue = quotes.reduce(
    (sum, quote) => sum + (
      quote.currency === "USD" ? quote.amount : 0
    ),
    0
  );

  const acceptedValue = accepted.reduce(
    (sum, quote) => sum + (
      quote.currency === "USD" ? quote.amount : 0
    ),
    0
  );

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>

          <div>
            <strong>QuoteFlow</strong>
            <span>AI Workspace</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">Q</div>

          <div>
            <strong>My Workspace</strong>
            <span>Free plan</span>
          </div>

          <ChevronDown size={16} />
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  page === item.name ? "active" : ""
                }`}
                onClick={() => navigateTo(item.name)}
              >
                <Icon size={19} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={22} />

            <strong>Unlock more with Pro</strong>

            <p>
              Create unlimited proposals and access
              AI-powered tools.
            </p>

            <button onClick={() => navigateTo("Settings")}>
              Explore Pro
            </button>
          </div>

          <div className="user-profile">
            <div className="user-avatar">JD</div>

            <div>
              <strong>John Doe</strong>
              <span>Personal account</span>
            </div>

            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <span>Workspace</span>
            <span className="breadcrumb">/</span>

            <strong>
              {page === "QuoteEditor" ? "Create Quote" : page}
            </strong>
          </div>

          <div className="topbar-actions">
            <span className="demo-label">Demo workspace</span>

            <button
              className="icon-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="top-avatar">JD</div>
          </div>
        </header>

        <div className="page-content">
          {page === "QuoteEditor" ? (
            <QuoteEditor
              onBack={() => navigateTo("Quotes")}
              onSave={handleQuoteSave}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    YOUR WORKSPACE
                  </div>

                  <h1>
                    {page === "Dashboard"
                      ? "Good morning, John 👋"
                      : page}
                  </h1>

                  <p>
                    {page === "Dashboard"
                      ? "Here's what's happening with your business today."
                      : `Manage your ${page.toLowerCase()} in one place.`}
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={createQuote}
                >
                  <Plus size={18} />
                  Create Quote
                </button>
              </div>

              {page === "Dashboard" || page === "Quotes" ? (
                <>
                  {page === "Dashboard" && (
                    <>
                      <div className="stats-grid">
                        <StatCard
                          title="Total Quotes"
                          value={quotes.length}
                          icon={<FileText size={20} />}
                          detail="All created proposals"
                        />

                        <StatCard
                          title="Accepted Value (USD)"
                          value={money(acceptedValue)}
                          icon={<CheckCircle2 size={20} />}
                          detail="Accepted USD proposals"
                        />

                        <StatCard
                          title="Pending Quotes"
                          value={pending.length}
                          icon={<Clock3 size={20} />}
                          detail="Awaiting response"
                        />

                        <StatCard
                          title="Total Quote Value (USD)"
                          value={money(totalQuoteValue)}
                          icon={<ArrowUpRight size={20} />}
                          detail="USD proposals only"
                        />
                      </div>

                      <div className="welcome-banner">
                        <div>
                          <span className="banner-tag">
                            <Sparkles size={14} />
                            QUOTEFLOW AI
                          </span>

                          <h2>
                            Turn ideas into winning proposals.
                          </h2>

                          <p>
                            Create professional quotes in minutes
                            and spend more time growing your business.
                          </p>

                          <button onClick={createQuote}>
                            Create your first quote
                            <ArrowUpRight size={17} />
                          </button>
                        </div>

                        <div className="banner-decoration">
                          <FileText
                            size={82}
                            strokeWidth={1.2}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <section className="table-card">
                    <div className="table-header">
                      <div>
                        <h2>
                          {page === "Dashboard"
                            ? "Recent Quotes"
                            : "All Quotes"}
                        </h2>

                        <p>
                          Keep track of your client proposals.
                        </p>
                      </div>

                      <div className="search-box">
                        <Search size={17} />

                        <input
                          placeholder="Search quotes..."
                          value={search}
                          onChange={(event) =>
                            setSearch(event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>QUOTE ID</th>
                            <th>CLIENT</th>
                            <th>SERVICE</th>
                            <th>AMOUNT</th>
                            <th>STATUS</th>
                            <th>DATE</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredQuotes.map((quote) => (
                            <tr key={quote.id}>
                              <td className="quote-id">
                                {quote.id}
                              </td>

                              <td className="client-cell">
                                {quote.client}
                              </td>

                              <td>{quote.service}</td>

                              <td className="amount-cell">
                                {money(
                                  quote.amount,
                                  quote.currency
                                )}
                              </td>

                              <td>
                                <span
                                  className={`status ${quote.status.toLowerCase()}`}
                                >
                                  <span className="status-dot" />
                                  {quote.status}
                                </span>
                              </td>

                              <td>{quote.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {filteredQuotes.length === 0 && (
                        <p className="empty-state">
                          No quotes found.
                        </p>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <div className="placeholder-card">
                  <div className="placeholder-icon">
                    {page === "Invoices" ? (
                      <Receipt size={32} />
                    ) : page === "Clients" ? (
                      <Users size={32} />
                    ) : (
                      <Settings size={32} />
                    )}
                  </div>

                  <h2>{page} workspace</h2>

                  <p>
                    We're building this module next.
                    Your workspace is taking shape!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon">{icon}</div>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-detail">{detail}</div>
    </div>
  );
}

export default App;
