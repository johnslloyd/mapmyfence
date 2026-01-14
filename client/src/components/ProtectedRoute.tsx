
import { useAuth } from "@/hooks/use-auth";
import { Route, Redirect } from "wouter";

export const ProtectedRoute = (props: any) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }



  return <Route {...props} />;
};
