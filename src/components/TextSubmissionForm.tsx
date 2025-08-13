import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:3001";

const TextSubmissionForm: React.FC = () => {
  const [text, setText] = useState("");
  const [mySubmission, setMySubmission] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<{ [key: string]: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
    const res = await fetch(`${API_URL}/my-submission`, {
      credentials: "include",
    });
    const data = await res.json();
    setMySubmission(data.text);
    setSubmitted(true);
  };

  // Poll for all submissions after submitting
  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/all-submissions`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.submissions) {
        setAllSubmissions(data.submissions);
        clearInterval(interval);
      } else {
        setAllSubmissions(null);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [submitted]);

  const handleClear = async () => {
    await fetch(`${API_URL}/clear-submissions`, {
      method: "POST",
      credentials: "include",
    });
    setAllSubmissions(null);
    setMySubmission(null);
    setSubmitted(false);
    setText("");
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text"
          disabled={submitted}
        />
        <button type="submit" disabled={submitted || !text.trim()}>
          Submit
        </button>
        {mySubmission && (
          <div style={{ marginTop: "1em" }}>
            <strong>Your submission:</strong> {mySubmission}
          </div>
        )}
        {allSubmissions && (
          <div style={{ marginTop: "2em" }}>
            <strong>All submissions:</strong>
            <ul>
              {Object.entries(allSubmissions).map(([id, submission]) => (
                <li key={id}>{submission}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
      <button type="button" onClick={handleClear} style={{ marginLeft: "1em" }}>
        Clear All
      </button>
    </>
  );
};

export default TextSubmissionForm;
