import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProperties, useUpgradeToPro } from "@/hooks/use-projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Trash2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { FREE_PROPERTY_LIMIT } from "@shared/routes";

function PlanCard() {
  const { user, login } = useAuth();
  const { data: properties } = useProperties();
  const upgrade = useUpgradeToPro();
  const isPro = user?.plan === "pro";
  const propertyCount = properties?.length ?? 0;

  const handleUpgrade = async () => {
    try {
      const data = await upgrade.mutateAsync();
      // No dedicated "refresh the current user" call in useAuth — just
      // merge the one field that actually changed, same shape the
      // server itself just returned.
      login({ ...user, plan: data.plan });
    } catch {
      // useUpgradeToPro already toasts the error.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Plan
          <Badge variant={isPro ? "default" : "secondary"} className="ml-1 capitalize">{user?.plan || "free"}</Badge>
        </CardTitle>
        <CardDescription>
          {isPro
            ? "Unlimited properties. Thanks for trying Pro early — it's free during beta."
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
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Upgrade to Pro for unlimited properties — no payment info needed, it's free while MyYardManager is in beta.
          </p>
          <Button onClick={handleUpgrade} disabled={upgrade.isPending} className="gap-2">
            <Sparkles className="w-4 h-4" /> {upgrade.isPending ? "Upgrading..." : "Upgrade to Pro — free during beta"}
          </Button>
        </CardContent>
      )}
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
const SUPPORT_EMAIL = "support@myyardmanager.app";

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
            <Input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
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
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete my MyYardManager account")}`}>
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
