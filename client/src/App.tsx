import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyOverview from "@/pages/PropertyOverview";
import Editor from "@/pages/Editor";
import ShoppingList from "@/pages/ShoppingList";
import BeforeYouDig from "@/pages/BeforeYouDig";
import { AuthProvider } from "./hooks/use-auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import AdminUserDetail from "./pages/AdminUserDetail";
import Privacy from "./pages/Privacy";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

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
      {/* Same self-enforced pattern as /account, not ProtectedRoute —
          Admin.tsx/AdminUserDetail.tsx redirect non-admins themselves.
          The real gate is server-side (server/routes.ts's `isAdmin`
          middleware on every /api/admin/* route) — see CLAUDE.md's
          "Admin panel" section. */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/users/:id" component={AdminUserDetail} />
      <ProtectedRoute path="/properties" component={Properties} />
      <ProtectedRoute path="/properties/:id" component={PropertyOverview} />
      {/* Redirect-like behavior for bare /editor */}
      <ProtectedRoute path="/editor" component={Editor} />
      <ProtectedRoute path="/editor/:id/shopping-list" component={ShoppingList} />
      <ProtectedRoute path="/editor/:id/before-you-dig" component={BeforeYouDig} />
      <ProtectedRoute path="/editor/:id" component={Editor} />
      {/* NotFound doesn't wrap its own Layout (most call sites already
          sit inside one) — the catch-all route is the one place that's
          never true, so it adds one here. */}
      <Route><Layout><NotFound /></Layout></Route>
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
