
import { useAuth } from "@/hooks/use-auth";
import { Route, Redirect } from "wouter";

export const ProtectedRoute = (props: any) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Route {...props} />;
};
