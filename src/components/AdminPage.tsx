import { Submission } from "types/api";

interface AdminPageProps {
  allSubmissions: { [key: string]: Submission } | null;
  onClear: () => void;
}

export default function AdminPage({ allSubmissions, onClear }: AdminPageProps) {
  console.log("allSubmissions in AdminPage:", allSubmissions);
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
              Name: {submission.name}, Horse: {submission.horse}, Wager: {submission.wager}
            </li>
          ))}
        </ul>
      ) : (
        <p>Waiting for all submissions...</p>
      )}
    </div>
  );
}
