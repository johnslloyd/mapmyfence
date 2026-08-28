import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Editor from "@/pages/Editor";
import ShoppingList from "@/pages/ShoppingList";
import BeforeYouDig from "@/pages/BeforeYouDig";
import { AuthProvider } from "./hooks/use-auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import Privacy from "./pages/Privacy";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>


      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={Privacy} />
      {/* Account itself enforces the auth check (redirects to /login) —
          not a passthrough like ProtectedRoute below, since unlike the
          editor's deliberate guest access, there's no guest-meaningful
          version of this page. */}
      <Route path="/account" component={Account} />
      <ProtectedRoute path="/projects" component={Projects} />
      {/* Redirect-like behavior for bare /editor */}
      <ProtectedRoute path="/editor" component={Editor} />
      <ProtectedRoute path="/editor/:id/shopping-list" component={ShoppingList} />
      <ProtectedRoute path="/editor/:id/before-you-dig" component={BeforeYouDig} />
      <ProtectedRoute path="/editor/:id" component={Editor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
