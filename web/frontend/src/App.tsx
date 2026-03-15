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
          <h2 style={headingStyle}>All Grants</h2>
          {error && <p style={{ color: "#f87171", margin: "0 0 0.75rem 0" }}>{error}</p>}
          {!grants || grants.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No grants yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {grants.map((grant) => (
                <li
                  key={grant.id}
                  style={{
                    border: "1px solid #4b5563",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    backgroundColor: "#1f2937",
                    color: "#e5e7eb",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>{grant.title}</h3>
                  <p style={{ margin: "0.25rem 0" }}><strong>Organization:</strong> {grant.organization}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Amount:</strong> {grant.amount}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Deadline:</strong> {grant.deadline}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Status:</strong> {grant.status}</p>
                  {grant.link && <p style={{ margin: "0.25rem 0" }}><strong>Link:</strong> {grant.link}</p>}
                  {grant.notes && <p style={{ margin: "0.25rem 0" }}><strong>Notes:</strong> {grant.notes}</p>}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => startEditing(grant)} style={secondaryButtonStyle}>Edit</button>
                    <button type="button" onClick={() => handleDelete(grant.id)} style={{ ...secondaryButtonStyle, color: "#f87171", borderColor: "#f87171" }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;