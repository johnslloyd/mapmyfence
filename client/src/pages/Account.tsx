import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProperties, useUpgradeToPro, useMyOrganization, useUpdateMyOrganization } from "@/hooks/use-projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Trash2, Sparkles, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FREE_PROPERTY_LIMIT } from "@shared/routes";

function PlanCard() {
  const { user, login } = useAuth();
  const { data: properties } = useProperties();
  const upgrade = useUpgradeToPro();
  // isPro, not a raw plan check — a business membership grants Pro too
  // (2026-09-10), so there's no reason to nag someone to personally
  // request it if their business already covers them. See
  // server/auth.ts's isEffectivelyPro.
  const isPro = user?.isPro;
  // A request is pending once planRequestedAt is set and hasn't been
  // resolved into an actual "pro" plan yet — plan alone can't tell
  // free-and-never-asked apart from free-and-waiting-on-review, which
  // is exactly why planRequestedAt is its own column (see
  // shared/schema.ts).
  const isPending = !isPro && !!user?.planRequestedAt;
  const propertyCount = properties?.length ?? 0;

  const handleRequest = async () => {
    try {
      const data = await upgrade.mutateAsync();
      // No dedicated "refresh the current user" call in useAuth — just
      // merge the fields that actually changed, same shape the server
      // itself just returned.
      login({ ...user, plan: data.plan, planRequestedAt: data.planRequestedAt });
    } catch {
      // useUpgradeToPro already toasts the error.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Plan
          <Badge variant={isPro ? "default" : "secondary"} className="ml-1 capitalize">
            {isPro ? "pro" : isPending ? "Pending approval" : "free"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isPro
            ? "Unlimited properties. Thanks for trying Pro early — it's free during beta."
            : isPending
            ? "Your request is with an admin for review — you'll be upgraded once it's approved."
            : `Free accounts can have up to ${FREE_PROPERTY_LIMIT} properties.`}
        </CardDescription>
      </CardHeader>
      {!isPro && (
        <CardContent>
          {/* A quiet usage meter, not just text — visible before the
              limit is ever hit, not just at the moment of rejection. */}
          <div className="mb-4 max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Properties</span>
              <span className="font-mono">{propertyCount} / {FREE_PROPERTY_LIMIT}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${propertyCount >= FREE_PROPERTY_LIMIT ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (propertyCount / FREE_PROPERTY_LIMIT) * 100)}%` }}
              />
            </div>
          </div>
          {isPending ? (
            <p className="text-sm text-muted-foreground max-w-md">
              Requested — no need to ask again, an admin has been notified.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Request Pro for unlimited properties and higher-resolution satellite imagery — no payment info needed, it's free while PostPlotter is in beta. An admin reviews each request.
              </p>
              <Button onClick={handleRequest} disabled={upgrade.isPending} className="gap-2">
                <Sparkles className="w-4 h-4" /> {upgrade.isPending ? "Sending request..." : "Request Pro access"}
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Business tier, Phase 1 (2026-09-10) — a member's own view of their
// business's contact info, the fields shown on every quote it sends
// (see CLAUDE.md's Phase 1 write-up). Renders nothing at all for an
// account with no org membership — same silent-when-not-applicable
// shape as PlanCard has no "you're not Pro" alarm, just a different
// CTA. Only an admin member can actually edit (server-enforced, see PUT
// /api/my-organization) — a plain member sees the same fields read-only
// with a short note instead of a form, rather than a form that would
// just 403 on submit.
function BusinessCard() {
  const { data: myOrg, isLoading } = useMyOrganization();
  const updateOrg = useUpdateMyOrganization();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Sync local form state whenever the fetched org data changes (first
  // load, or after a successful save) — same pattern as any form backed
  // by server data with no separate "edit mode" toggle.
  useEffect(() => {
    if (myOrg) {
      setName(myOrg.name);
      setPhone(myOrg.phone || "");
      setEmail(myOrg.email || "");
    }
  }, [myOrg]);

  if (isLoading || !myOrg) return null;

  const isAdmin = myOrg.role === "admin";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg.mutate({ name: name.trim(), phone: phone.trim() || null, email: email.trim() || null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Business
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "Shown on every quote your business sends — see it live on Editor's \"Send Quote\" panel."
            : "Your business's info, shown on every quote it sends. Only an admin can edit this."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          <form onSubmit={handleSave} className="grid gap-4 max-w-sm">
            <div className="grid gap-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input id="business-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-phone">Phone</Label>
              <Input id="business-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 867-5309" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-email">Email</Label>
              <Input id="business-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@yourbusiness.com" />
            </div>
            <Button type="submit" disabled={updateOrg.isPending || !name.trim()} className="w-fit">
              {updateOrg.isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        ) : (
          <div className="text-sm space-y-1 max-w-sm">
            <div className="font-medium">{myOrg.name}</div>
            {myOrg.phone && <div className="text-muted-foreground">{myOrg.phone}</div>}
            {myOrg.email && <div className="text-muted-foreground">{myOrg.email}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// The support address a "delete my account" request actually goes to.
// Real deletion isn't self-serve/automated in this beta on purpose —
// projects.userId has no ON DELETE behavior defined, so an instant
// self-serve delete would need real handling for what happens to a
// user's existing projects/fence lines first. A stated, working way out
// is what beta users are owed; building the automated flow safely can
// follow once that's been thought through.
// A real inbox, not a placeholder domain-based address — the user's
// own, until a real monitored support inbox exists (see MVP launch
// blockers in CLAUDE.md).
const SUPPORT_EMAIL = "john.steven.lloyd.jr@gmail.com";

function ChangePasswordCard() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: "Saved", description: "Your password has been updated.", variant: "success" });
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> Change Password
        </CardTitle>
        <CardDescription>Update the password you use to log in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-sm">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmNewPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? "Saving..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <Trash2 className="w-4 h-4" /> Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and projects. This can't be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Account deletion isn't self-serve yet — email us and we'll take care of it for you.
        </p>
        <Button asChild variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete my PostPlotter account")}`}>
            Email {SUPPORT_EMAIL}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountContent() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
      </div>
      <PlanCard />
      <BusinessCard />
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}

export default function Account() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (!loading && !isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (loading) {
    return <Layout><div className="max-w-2xl mx-auto p-4 md:p-8">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <AccountContent />
    </Layout>
  );
}
