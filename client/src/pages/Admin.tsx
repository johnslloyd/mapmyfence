import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useAdminUsers, useAdminEvents } from "@/hooks/use-admin";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Shield, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Read-only support/debugging + beta-usage-monitoring tool — see
// CLAUDE.md's "Admin panel" section for the product reasoning (view-
// only on purpose, gated server-side on users.isAdmin, every view
// audit-logged). No edit affordances anywhere on this page or
// AdminUserDetail.tsx — that was a deliberate scope line, not
// something left out for time.

const EVENT_LABEL: Record<string, string> = {
  account_created: "Account created",
  property_created: "Property created",
  project_created: "Project created",
  fence_line_created: "Fence line drawn",
  estimate_viewed: "Estimate viewed",
  account_upgraded: "Upgraded to Pro",
  admin_viewed_users: "Viewed user list",
  admin_viewed_user: "Viewed a user",
};

function UsersTab() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const filtered = users?.filter((u: any) => u.email.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0">{filtered?.length ?? 0} users</span>
      </div>
      <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Email</th>
              <th className="text-left px-4 py-2.5 font-medium">Plan</th>
              <th className="text-left px-4 py-2.5 font-medium">Properties</th>
              <th className="text-left px-4 py-2.5 font-medium">Projects</th>
              <th className="text-left px-4 py-2.5 font-medium">Joined</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered?.map((u: any) => (
              <tr key={u.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-2.5 font-medium">
                  {u.email}
                  {u.isAdmin && (
                    <Badge variant="outline" className="ml-1.5 text-[10px] h-4 px-1.5 font-normal">Admin</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={u.plan === "pro" ? "default" : "secondary"} className="capitalize text-[10px] h-5 font-normal">
                    {u.plan}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 font-mono">{u.propertyCount}</td>
                <td className="px-4 py-2.5 font-mono">{u.projectCount}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/users/${u.id}`} className="text-primary text-xs font-medium inline-flex items-center gap-1 hover:underline">
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered?.length === 0 && (
          <div className="text-sm text-muted-foreground py-10 text-center">No users match "{search}".</div>
        )}
      </div>
    </div>
  );
}

function ActivityTab() {
  const { data: eventsList, isLoading } = useAdminEvents();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading activity...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Most recent 200 events, across every account — the same funnel log used elsewhere, nothing separate to maintain.</p>
        <span className="text-xs font-mono text-muted-foreground shrink-0">{eventsList?.length ?? 0} events</span>
      </div>
      <div className="border border-border rounded-xl divide-y divide-border">
        {eventsList?.map((e: any) => (
          <div key={e.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium shrink-0">{EVENT_LABEL[e.type] || e.type}</span>
              {e.userEmail && <span className="text-muted-foreground truncate">— {e.userEmail}</span>}
              {e.targetUserEmail && <span className="text-muted-foreground truncate">&rarr; {e.targetUserEmail}</span>}
            </div>
            <span className="text-xs text-muted-foreground font-mono shrink-0" title={format(new Date(e.createdAt), "PPpp")}>
              {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
        {eventsList?.length === 0 && (
          <div className="text-sm text-muted-foreground py-10 text-center">No activity logged yet.</div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Same self-enforced pattern Account.tsx uses — ProtectedRoute is a
  // no-op passthrough (see its own comment), so every page that
  // genuinely needs to gate access checks for itself. This is the
  // CLIENT-side half only, purely for a clean redirect instead of a
  // broken-looking page — server/routes.ts's `isAdmin` middleware is
  // what actually protects the data.
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading || !isAuthenticated || !user?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-4 md:p-8 text-sm text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Admin
          </h1>
          <p className="text-muted-foreground mt-1">Read-only. Every view on this page is logged.</p>
        </div>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
