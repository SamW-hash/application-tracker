import { useEffect, useState } from "react";

type Grant = {
  id: string;
  title: string;
  organization: string;
  amount: number;
  deadline: string;
  link?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function App() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [amount, setAmount] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline-soonest");

  const statusCounts = grants.reduce(
    (acc, g) => {
      const s = g.status.toLowerCase();
      acc.total++;
      if (s === "open") acc.open++;
      else if (s === "applied") acc.applied++;
      else if (s === "won") acc.won++;
      else if (s === "rejected") acc.rejected++;
      else if (s === "closed") acc.closed++;
      return acc;
    },
    { total: 0, open: 0, applied: 0, won: 0, rejected: 0, closed: 0 }
  );

  const filteredAndSortedGrants = (() => {
    let list = grants ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.organization.toLowerCase().includes(q) ||
          (g.notes && g.notes.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((g) => g.status.toLowerCase() === statusFilter.toLowerCase());
    }
    const sorted = [...list];
    switch (sortBy) {
      case "deadline-soonest":
        sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
        break;
      case "deadline-latest":
        sorted.sort((a, b) => b.deadline.localeCompare(a.deadline));
        break;
      case "title-az":
        sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
        break;
      case "title-za":
        sorted.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: "base" }));
        break;
      case "amount-high":
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-low":
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      default:
        sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
    }
    return sorted;
  })();

  function formatDeadline(deadline: string): string {
    if (deadline.length < 10) return deadline;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const y = deadline.slice(0, 4);
    const m = parseInt(deadline.slice(5, 7), 10) - 1;
    const d = parseInt(deadline.slice(8, 10), 10);
    if (m < 0 || m > 11 || isNaN(d)) return deadline;
    return `${months[m]} ${d}, ${y}`;
  }

  const statusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    const colors: Record<string, { bg: string; text: string }> = {
      OPEN: { bg: "#3b82f6", text: "#fff" },
      APPLIED: { bg: "#f97316", text: "#fff" },
      WON: { bg: "#22c55e", text: "#fff" },
      REJECTED: { bg: "#ef4444", text: "#fff" },
      CLOSED: { bg: "#6b7280", text: "#fff" },
    };
    const c = colors[s] ?? { bg: "#6b7280", text: "#fff" };
    return {
      display: "inline-block",
      padding: "0.2rem 0.5rem",
      borderRadius: "4px",
      fontSize: "0.875rem",
      fontWeight: 500,
      backgroundColor: c.bg,
      color: c.text,
    };
  };

  function resetForm() {
    setTitle("");
    setOrganization("");
    setAmount(0);
    setDeadline("");
    setLink("");
    setNotes("");
    setStatus("open");
    setEditingGrant(null);
  }

  function startEditing(grant: Grant) {
    setEditingGrant(grant);
    setTitle(grant.title);
    setOrganization(grant.organization);
    setAmount(grant.amount);
    setDeadline(grant.deadline ?? "");
    setLink(grant.link ?? "");
    setNotes(grant.notes ?? "");
    setStatus(grant.status);
  }

  async function fetchGrants() {
    try {
      setError("");
      const res = await fetch("http://localhost:8080/api/grants");
      if (!res.ok) {
        throw new Error("Failed to fetch grants");
      }
      const data = await res.json();
      setGrants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Could not load grants");
      console.error(err);
    }
  }

  useEffect(() => {
    fetchGrants();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = {
      title,
      organization,
      amount,
      deadline,
      link,
      notes,
      status,
    };

    try {
      setError("");
      if (editingGrant) {
        const res = await fetch(`http://localhost:8080/api/grants/${editingGrant.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error("Failed to update grant");
        }
        await fetchGrants();
        resetForm();
      } else {
        const res = await fetch("http://localhost:8080/api/grants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error("Failed to create grant");
        }
        await fetchGrants();
        resetForm();
      }
    } catch (err) {
      setError(editingGrant ? "Could not update grant" : "Could not create grant");
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    try {
      setError("");
      const res = await fetch(`http://localhost:8080/api/grants/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete grant");
      }

      await fetchGrants();
    } catch (err) {
      setError("Could not delete grant");
      console.error(err);
    }
  }

  async function handleResetDatabase() {
    const confirmed = window.confirm(
      "This will permanently delete all grants. This action cannot be undone. Are you sure you want to reset the database?"
    );
    if (!confirmed) return;
    try {
      setError("");
      const res = await fetch("http://localhost:8080/api/grants", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to reset database");
      }
      await fetchGrants();
      resetForm();
    } catch (err) {
      setError("Could not reset database");
      console.error(err);
    }
  }

  const panelStyle = {
    border: "1px solid #4b5563",
    borderRadius: "8px",
    padding: "1.5rem",
    backgroundColor: "#374151",
  };
  const headingStyle = { marginTop: 0, color: "#f3f4f6", fontWeight: 600 };
  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #4b5563",
    borderRadius: "6px",
    backgroundColor: "#1f2937",
    color: "#f9fafb",
  };
  const primaryButtonStyle = {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "1px solid #6366f1",
    backgroundColor: "#6366f1",
    color: "#fff",
    fontWeight: 500,
    cursor: "pointer" as const,
  };
  const secondaryButtonStyle = {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "1px solid #6b7280",
    backgroundColor: "transparent",
    color: "#e5e7eb",
    fontWeight: 500,
    cursor: "pointer" as const,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "2rem", boxSizing: "border-box", backgroundColor: "#111827" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <h1 style={{ margin: "0 0 1.25rem 0", color: "#f9fafb", textAlign: "center", lineHeight: 1.2 }}>Application Tracker</h1>
        <p style={{ margin: 0, color: "#9ca3af", textAlign: "center", fontSize: "1rem", lineHeight: 1.4 }}>Manage and track grant opportunities</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "35% 1fr",
          gap: "2rem",
          flex: 1,
          minHeight: 0,
          alignItems: "start",
        }}
      >
        <section style={panelStyle}>
          <h2 style={headingStyle}>{editingGrant ? "Edit Grant" : "Create Grant"}</h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={inputStyle}
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, minHeight: "4rem", resize: "vertical" }}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="open">open</option>
              <option value="applied">applied</option>
              <option value="closed">closed</option>
              <option value="won">won</option>
              <option value="rejected">rejected</option>
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" style={primaryButtonStyle}>{editingGrant ? "Update Grant" : "Create Grant"}</button>
              {editingGrant && (
                <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={{ ...panelStyle, overflow: "auto", minHeight: "420px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <h2 style={{ ...headingStyle, marginBottom: 0 }}>All Grants</h2>
            <button
              type="button"
              onClick={handleResetDatabase}
              style={{ ...secondaryButtonStyle, color: "#f87171", borderColor: "#f87171", fontSize: "0.875rem" }}
            >
              Reset database
            </button>
          </div>
          <div style={{ marginBottom: "0.75rem", color: "#9ca3af", fontSize: "0.9375rem" }}>
            Total Grants: {statusCounts.total}
            {" · "}
            Open: {statusCounts.open}
            {" · "}
            Applied: {statusCounts.applied}
            {" · "}
            Won: {statusCounts.won}
            {" · "}
            Rejected: {statusCounts.rejected}
            {" · "}
            Closed: {statusCounts.closed}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, flex: "1 1 8rem", minWidth: "6rem" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...inputStyle, flex: "0 1 auto", minWidth: "7rem" }}
            >
              <option value="all">Status: All</option>
              <option value="open">Status: Open</option>
              <option value="applied">Status: Applied</option>
              <option value="won">Status: Won</option>
              <option value="rejected">Status: Rejected</option>
              <option value="closed">Status: Closed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...inputStyle, flex: "0 1 auto", minWidth: "10rem" }}
            >
              <option value="deadline-soonest">Sort: Deadline Soonest</option>
              <option value="deadline-latest">Sort: Deadline Latest</option>
              <option value="title-az">Sort: Title A–Z</option>
              <option value="title-za">Sort: Title Z–A</option>
              <option value="amount-high">Sort: Amount High to Low</option>
              <option value="amount-low">Sort: Amount Low to High</option>
            </select>
          </div>
          {error && <p style={{ color: "#f87171", margin: "0 0 0.75rem 0" }}>{error}</p>}
          {!grants || grants.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No grants yet.</p>
          ) : filteredAndSortedGrants.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No grants match the current filters.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#e5e7eb", fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr style={{ borderTop: "1px dashed #6b7280" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontWeight: 600, color: "#f3f4f6", borderBottom: "1px dashed #6b7280" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontWeight: 600, color: "#f3f4f6", borderBottom: "1px dashed #6b7280" }}>Organization</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: "#f3f4f6", borderBottom: "1px dashed #6b7280" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontWeight: 600, color: "#f3f4f6", borderBottom: "1px dashed #6b7280" }}>Deadline</th>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontWeight: 600, color: "#f3f4f6", borderBottom: "1px dashed #6b7280" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: "#f3f4f6", borderBottom: "1px dashed #6b7280", width: "1%" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedGrants.map((grant) => (
                  <tr
                    key={grant.id}
                    onMouseEnter={() => setHoveredRowId(grant.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    style={{
                      borderBottom: "1px dashed #4b5563",
                      backgroundColor: hoveredRowId === grant.id ? "#4b5563" : "transparent",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "0.5rem 0.75rem" }}>{grant.title}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>{grant.organization}</td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>${grant.amount.toLocaleString()}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>{formatDeadline(grant.deadline)}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <span style={statusBadgeStyle(grant.status)}>{grant.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => startEditing(grant)} style={secondaryButtonStyle}>Edit</button>
                      {" "}
                      <button type="button" onClick={() => handleDelete(grant.id)} style={{ ...secondaryButtonStyle, color: "#f87171", borderColor: "#f87171" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;