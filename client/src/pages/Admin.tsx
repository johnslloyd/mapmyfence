import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useAdminUsers,
  useAdminEvents,
  useAdminOrganizations,
  useAdminOrganization,
  useAdminCreateOrganization,
  useAdminAddOrganizationMember,
  useAdminUpdateOrganizationMemberRole,
  useAdminRemoveOrganizationMember,
} from "@/hooks/use-admin";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Shield, ArrowRight, Sparkles, Building2, Plus, Trash2, ChevronDown, UserPlus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Started read-only (see CLAUDE.md's "Admin panel" section for the
// original product reasoning: gated server-side on users.isAdmin, every
// view audit-logged) — since grown several real edit actions, all
// genuinely admin-only decisions rather than routine data entry:
// deleting a user (AdminUserDetail.tsx), approving/dismissing a Pro
// access request (ProRequestBanner, same file), and — added here
// (2026-09-10) — creating a business and managing its roster
// (OrganizationsTab below). Still no bulk edits or anything that
// touches a user's own project data directly.

const EVENT_LABEL: Record<string, string> = {
  account_created: "Account created",
  property_created: "Property created",
  project_created: "Project created",
  fence_line_created: "Fence line drawn",
  estimate_viewed: "Estimate viewed",
  account_upgraded: "Upgraded to Pro",
  admin_viewed_users: "Viewed user list",
  admin_viewed_user: "Viewed a user",
  pro_requested: "Requested Pro access",
  admin_approved_pro: "Approved a Pro request",
  admin_dismissed_pro_request: "Dismissed a Pro request",
};

function UsersTab() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const filtered = users?.filter((u: any) => u.email.toLowerCase().includes(search.toLowerCase()));
  const pendingCount = users?.filter((u: any) => u.plan !== "pro" && u.planRequestedAt).length ?? 0;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      {/* The email notification (server/authRoutes.ts) links straight to
          the requesting user's own detail page, so this isn't the only
          way to find a pending request — just a quick-glance backstop
          for browsing here directly instead. */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          {pendingCount} Pro {pendingCount === 1 ? "request" : "requests"} awaiting review.
        </div>
      )}
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
                  {u.plan !== "pro" && u.planRequestedAt && (
                    <Badge variant="outline" className="ml-1 text-[10px] h-5 font-normal gap-1 border-primary/40 text-primary">
                      <Sparkles className="w-2.5 h-2.5" /> Pending
                    </Badge>
                  )}
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

// Business tier (2026-09-10) — the platform-Staff side of org
// management, gated on users.isAdmin like the rest of this page (not
// an org's OWN admin role — see shared/schema.ts's organizations
// comment on why those are deliberately two different things). Every
// route this calls (api.admin.*Organization*) has existed since Phase
// 0; this is the first time any of it has a client UI at all — until
// now, creating a business or managing its roster meant a raw curl
// call. See CLAUDE.md's Phase 0 write-up.
function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [firstAdminEmail, setFirstAdminEmail] = useState("");
  const createOrg = useAdminCreateOrganization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrg.mutate(
      { name: name.trim(), firstAdminEmail: firstAdminEmail.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setFirstAdminEmail("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Create Business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Create a Business</DialogTitle>
          <DialogDescription>
            The owner needs a free PostPlotter account already — this doesn't create one for them, and grants Pro access to their whole future roster automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="org-name">Business name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Fencing LLC" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="org-first-admin">Owner's email</Label>
            <Input id="org-first-admin" type="email" value={firstAdminEmail} onChange={(e) => setFirstAdminEmail(e.target.value)} placeholder="owner@example.com" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !firstAdminEmail.trim() || createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// The roster detail for ONE business, shown inline when its row is
// expanded — same add/promote/demote/remove actions Business.tsx gives
// a business's OWN admin for self-service, mirrored here so a platform
// admin can actually help a business (e.g. onboarding, or assisting a
// pilot that's stuck) instead of only being able to create it and walk
// away.
function OrganizationRoster({ organizationId }: { organizationId: number }) {
  const { data, isLoading } = useAdminOrganization(organizationId);
  const addMember = useAdminAddOrganizationMember(organizationId);
  const updateRole = useAdminUpdateOrganizationMemberRole(organizationId);
  const removeMember = useAdminRemoveOrganizationMember(organizationId);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-6 text-center">Loading roster...</div>;
  }
  if (!data) {
    return <div className="text-sm text-muted-foreground py-6 text-center">Couldn't load this business.</div>;
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    addMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      { onSuccess: () => { setInviteEmail(""); setInviteRole("member"); } }
    );
  };

  return (
    <div className="px-4 py-4 bg-secondary/20 space-y-4">
      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="grid gap-1.5 flex-1">
          <Label htmlFor={`invite-email-${organizationId}`} className="text-xs">Add a member</Label>
          <Input
            id={`invite-email-${organizationId}`}
            type="email"
            placeholder="teammate@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-8"
          />
        </div>
        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
          <SelectTrigger className="sm:w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={!inviteEmail.trim() || addMember.isPending} className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" /> Add
        </Button>
      </form>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {data.members.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate">{m.email}</span>
              <Badge variant={m.role === "admin" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5 font-normal capitalize shrink-0">
                {m.role}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-6 text-muted-foreground"
                disabled={updateRole.isPending}
                onClick={() => updateRole.mutate({ userId: m.userId, role: m.role === "admin" ? "member" : "admin" })}
              >
                {m.role === "admin" ? "Make member" : "Make admin"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {m.email}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      They'll lose Pro access from this business immediately, unless they're Pro on their own account too. This doesn't delete their PostPlotter account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => removeMember.mutate(m.userId)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganizationsTab() {
  const { data: orgs, isLoading } = useAdminOrganizations();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-10 text-center">Loading businesses...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Every business on the platform. Creating one grants its first admin Pro access immediately.</p>
        <CreateOrganizationDialog />
      </div>
      <div className="border border-border rounded-xl overflow-hidden">
        {orgs?.map((org: any) => (
          <div key={org.id} className="border-t border-border first:border-t-0">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
              className="w-full flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium truncate">{org.name}</span>
                <Badge variant="outline" className="text-[10px] h-5 font-normal shrink-0">
                  {org.memberCount} {org.memberCount === 1 ? "member" : "members"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground font-mono">{format(new Date(org.createdAt), "MMM d, yyyy")}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === org.id ? "rotate-180" : ""}`} />
              </div>
            </button>
            {expandedId === org.id && <OrganizationRoster organizationId={org.id} />}
          </div>
        ))}
        {orgs?.length === 0 && (
          <div className="text-sm text-muted-foreground py-10 text-center">No businesses yet — create the first one above.</div>
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
          <p className="text-muted-foreground mt-1">Every view and edit here is logged.</p>
        </div>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="businesses" className="mt-4">
            <OrganizationsTab />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
