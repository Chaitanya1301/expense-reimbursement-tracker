import { useAuth } from "../context/AuthContext";
import { RequesterHome } from "./RequesterHome";
import { ReviewerHome } from "./ReviewerHome";
import { AdminHome } from "./AdminHome";

export function RoleHome() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "REQUESTER":
      return <RequesterHome />;
    case "REVIEWER":
      return <ReviewerHome />;
    case "ADMIN":
      return <AdminHome />;
  }
}
