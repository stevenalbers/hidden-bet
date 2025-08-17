import { Submission } from "types/api";

interface AdminPageProps {
  allSubmissions: { [key: string]: Submission } | null;
  onClear: () => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : `https://${window.location.hostname}`);

export default function AdminPage({ allSubmissions, onClear }: AdminPageProps) {
  const handleClearPlayer = async (sessionId: string) => {
    await fetch(`${API_BASE_URL}/clear-submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      credentials: "include",
    });
    // No need to manually update, context will update on broadcast
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={onClear}>Clear All Submissions</button>
      <hr />
      <h3>All Submissions</h3>
      {allSubmissions ? (
        <ul>
          {Object.entries(allSubmissions).map(([id, submission]) => (
            <li key={id}>
              {submission.name}
              <button style={{ marginLeft: 8 }} onClick={() => handleClearPlayer(id)}>
                Clear
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Waiting for all submissions...</p>
      )}
    </div>
  );
}
