import { useAuth } from "../context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  REQUESTER: "Requester",
  REVIEWER: "Reviewer",
  ADMIN: "Administrator",
};

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Expense Tracker</h1>
          {user && <p>Signed in as {user.name} ({ROLE_LABELS[user.role]})</p>}
        </div>
        <button onClick={() => void logout()}>Sign out</button>
      </header>

      <main>
        <p>
          This is a placeholder landing page. The reimbursement request workflow
          (create, submit, review, approve/reject, mark as paid) will be built here.
        </p>
      </main>
    </div>
  );
}
