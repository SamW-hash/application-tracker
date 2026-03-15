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

    try {
      setError("");
      const res = await fetch("http://localhost:8080/api/grants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          organization,
          amount,
          deadline,
          link,
          notes,
          status,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create grant");
      }

      setTitle("");
      setOrganization("");
      setAmount(0);
      setDeadline("");
      setLink("");
      setNotes("");
      setStatus("open");

      await fetchGrants();
    } catch (err) {
      setError("Could not create grant");
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

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <h1>Application Tracker</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Create Grant</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Organization"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <input
          type="text"
          placeholder="Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">open</option>
          <option value="applied">applied</option>
          <option value="closed">closed</option>
          <option value="won">won</option>
          <option value="rejected">rejected</option>
        </select>
        <button type="submit">Create Grant</button>
      </form>

      <h2>All Grants</h2>
      {!grants || grants.length === 0 ? (
        <p>No grants yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {grants.map((grant) => (
            <li
              key={grant.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <h3>{grant.title}</h3>
              <p><strong>Organization:</strong> {grant.organization}</p>
              <p><strong>Amount:</strong> {grant.amount}</p>
              <p><strong>Deadline:</strong> {grant.deadline}</p>
              <p><strong>Status:</strong> {grant.status}</p>
              {grant.link && <p><strong>Link:</strong> {grant.link}</p>}
              {grant.notes && <p><strong>Notes:</strong> {grant.notes}</p>}
              <button onClick={() => handleDelete(grant.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;