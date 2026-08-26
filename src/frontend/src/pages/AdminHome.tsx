import { useAuth } from "../context/AuthContext";

export function AdminHome() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Expense Tracker</h1>
          {user && <p>Signed in as {user.name} (Administrator)</p>}
        </div>
        <button onClick={() => void logout()}>Sign out</button>
      </header>

      <main>
        <p>
          User management (view users, assign roles, activate/deactivate accounts) is planned for a later phase
          of this build.
        </p>
      </main>
    </div>
  );
}
