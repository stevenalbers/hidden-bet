import { API_BASE_URL } from "../consts";
import { Submission } from "types/api";

type Horse = "Horse A" | "Horse B";

async function handleDeclareWinner(horse: Horse) {
  await fetch(`${API_BASE_URL}/declare-winner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winner: horse }),
    credentials: "include",
  });
}

interface AdminPageProps {
  allSubmissions: { [key: string]: Submission } | null;
  onClear: () => void;
}

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
      <div style={{ margin: "1rem 0" }}>
        <button onClick={() => handleDeclareWinner("Horse A")}>Declare Horse A Winner</button>
        <button style={{ marginLeft: 8 }} onClick={() => handleDeclareWinner("Horse B")}>
          Declare Horse B Winner
        </button>
      </div>
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
