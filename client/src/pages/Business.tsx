import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  useMyOrganization,
  useUpdateMyOrganization,
  useOrganizationMembers,
  useAddOrganizationMember,
  useUpdateOrganizationMemberRole,
  useRemoveOrganizationMember,
  useOrganizationQuotes,
  useOrganizationRates,
  useSetOrganizationRates,
} from "@/hooks/use-projects";
import { ORG_SEAT_LIMIT } from "@shared/routes";
import { MATERIAL_LABELS } from "@/lib/estimates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Building2, Users, UserPlus, Trash2, Image as ImageIcon, FileText, DollarSign } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";

// The 3 real fence material values (EditFenceLineCard.tsx's Material
// select) and the 2 real heights (products.forHeight's own convention)
// — the fixed 6-cell grid every business rate sheet actually needs.
// Vinyl/Iron aren't listed: they're still disabled in the material
// picker itself ("pricing coming soon", see CLAUDE.md), so a business
// can't draw a line in that material yet either.
const RATE_MATERIALS = ["wood_pine", "wood_cedar", "wood_pine_cedar_picket"] as const;
const RATE_HEIGHTS = [6, 8] as const;

// Business tier, Phase 2 (2026-09-10) — the first real roster-
// management UI anywhere in this app. Phase 0/1 deliberately shipped
// with NO business-facing UI for this at all (org management was
// API/DB-only, run by a platform Staff account) — see CLAUDE.md's
// Phase 0/1 write-ups. This page is that gap closed, scoped to what
// Phase 2 actually asks for: invite/remove/promote/demote, the seat
// cap, logo upload, and a "sent" quotes rollup. Business contact-info
// EDITING (name/phone/email) stays on Account.tsx's BusinessCard,
// already built in Phase 1 — this page doesn't duplicate that.
//
// Self-enforces its own auth AND org-membership redirect directly in
// the component, same pattern as Account.tsx/Admin.tsx — there's no
// guest-meaningful version of a team roster page.

// Resizes/re-encodes an uploaded image client-side before it ever
// reaches the server — keeps every logo well under ORG_LOGO_MAX_CHARS
// without the server needing to reject or silently truncate anything.
// 200x200 is plenty for the small badge-sized places a logo actually
// renders (Account's BusinessCard, this page, a sent quote's branding).
function resizeImageToDataUrl(file: File, maxDim = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Couldn't process that image."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function LogoUpload({ logoData, isAdmin }: { logoData: string | null; isAdmin: boolean }) {
  const updateOrg = useUpdateMyOrganization();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      updateOrg.mutate({ logoData: dataUrl });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Couldn't process that image.", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl border border-border bg-secondary/30 flex items-center justify-center overflow-hidden shrink-0">
        {logoData ? (
          <img src={logoData} alt="Business logo" className="w-full h-full object-contain" />
        ) : (
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={updateOrg.isPending}>
            {updateOrg.isPending ? "Uploading..." : logoData ? "Change logo" : "Upload logo"}
          </Button>
          {logoData && (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => updateOrg.mutate({ logoData: null })}>
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function RosterSection({ isAdmin, currentUserId }: { isAdmin: boolean; currentUserId: string }) {
  const { data: members, isLoading } = useOrganizationMembers();
  const addMember = useAddOrganizationMember();
  const updateRole = useUpdateOrganizationMemberRole();
  const removeMember = useRemoveOrganizationMember();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  const memberCount = members?.length ?? 0;
  const atSeatLimit = memberCount >= ORG_SEAT_LIMIT;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    addMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      { onSuccess: () => { setInviteEmail(""); setInviteRole("member"); } }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Team
          <span className="text-xs font-mono text-muted-foreground font-normal ml-1">
            {memberCount} / {ORG_SEAT_LIMIT} seats
          </span>
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "Everyone here gets Pro access automatically for as long as they're on the roster."
            : "Your team — only an admin can invite, remove, or change roles."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="grid gap-1.5 flex-1">
              <Label htmlFor="invite-email">Add a team member</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={atSeatLimit}
              />
            </div>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")} disabled={atSeatLimit}>
              <SelectTrigger className="sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!inviteEmail.trim() || addMember.isPending || atSeatLimit} className="gap-2">
              <UserPlus className="w-4 h-4" /> {addMember.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
        )}
        {isAdmin && atSeatLimit && (
          <p className="text-xs text-muted-foreground">
            You're at the {ORG_SEAT_LIMIT}-seat limit — remove someone before adding another teammate.
          </p>
        )}
        {isAdmin && (
          <p className="text-xs text-muted-foreground -mt-2">
            They need their own free PostPlotter account already — this doesn't create one for them.
          </p>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading your team...</div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Email</th>
                  <th className="text-left px-4 py-2.5 font-medium">Role</th>
                  <th className="text-left px-4 py-2.5 font-medium">Joined</th>
                  {isAdmin && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {members?.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-2.5 font-medium">
                      {m.email}
                      {m.userId === currentUserId && (
                        <Badge variant="outline" className="ml-1.5 text-[10px] h-4 px-1.5 font-normal">You</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={m.role === "admin" ? "default" : "secondary"} className="capitalize text-[10px] h-5 font-normal">
                        {m.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(m.createdAt), "MMM d, yyyy")}</td>
                    {isAdmin && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-muted-foreground"
                            disabled={updateRole.isPending}
                            onClick={() => updateRole.mutate({ userId: m.userId, role: m.role === "admin" ? "member" : "admin" })}
                          >
                            {m.role === "admin" ? "Make member" : "Make admin"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
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
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Business tier, Phase 3 — the actual pricing model change: a quote's
// bottom line is now this business's OWN rate (material x height),
// not the real Lowe's/Home Depot material cost `calculateEstimate`
// computes for the DIYer's own itemized view. See organizationRates'
// shared/schema.ts comment for the full reasoning. A 3x2 grid (the
// only real material/height combinations this app's fence editor
// supports today) plus one flat teardown add-on — 7 numbers total,
// matching exactly what was asked for: "all pine gets xx per foot...
// teardown adds xx per foot."
//
// State is a local draft keyed by "material-height", seeded from the
// fetched rates and re-synced whenever they change (save, or another
// tab's edit) — same "local form state synced from server data" shape
// as BusinessCard's own name/phone/email fields on Account.tsx. Empty
// means "not set" (a blocked material for quoting), not zero.
function PricingSection({ isAdmin, teardownRatePerFoot }: { isAdmin: boolean; teardownRatePerFoot: number | null }) {
  const { data: rates, isLoading } = useOrganizationRates();
  const setRates = useSetOrganizationRates();
  const updateOrg = useUpdateMyOrganization();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [teardownDraft, setTeardownDraft] = useState("");

  useEffect(() => {
    if (!rates) return;
    const next: Record<string, string> = {};
    for (const r of rates) {
      next[`${r.material}-${r.height}`] = String(r.ratePerFoot);
    }
    setDraft(next);
  }, [rates]);

  useEffect(() => {
    setTeardownDraft(teardownRatePerFoot != null ? String(teardownRatePerFoot) : "");
  }, [teardownRatePerFoot]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = RATE_MATERIALS.flatMap((material) =>
      RATE_HEIGHTS.map((height) => {
        const raw = draft[`${material}-${height}`]?.trim();
        return { material, height, ratePerFoot: raw ? parseFloat(raw) : null };
      })
    );
    setRates.mutate(payload);
    const teardownRaw = teardownDraft.trim();
    updateOrg.mutate({ teardownRatePerFoot: teardownRaw ? parseFloat(teardownRaw) : null });
  };

  const isPending = setRates.isPending || updateOrg.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> Pricing
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "What you charge per linear foot, by material — this is what a customer sees on a sent quote, not the real material cost. Leave a cell blank to stop quoting that material."
            : "What your business charges per linear foot. Only an admin can edit this."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading your rates...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Material</th>
                    {RATE_HEIGHTS.map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium">{h} ft ($/ft)</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATE_MATERIALS.map((material) => (
                    <tr key={material} className="border-t border-border">
                      <td className="px-4 py-2.5 font-medium">{MATERIAL_LABELS[material] || material}</td>
                      {RATE_HEIGHTS.map((height) => {
                        const key = `${material}-${height}`;
                        return (
                          <td key={key} className="px-4 py-2">
                            {isAdmin ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Not set"
                                value={draft[key] ?? ""}
                                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                                className="h-8 w-28 font-mono"
                              />
                            ) : (
                              <span className="font-mono">{draft[key] ? `$${draft[key]}` : "—"}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-1.5 max-w-xs">
              <Label htmlFor="teardown-rate">Teardown of existing fence (per ft, optional)</Label>
              {isAdmin ? (
                <Input
                  id="teardown-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Not offered"
                  value={teardownDraft}
                  onChange={(e) => setTeardownDraft(e.target.value)}
                  className="font-mono"
                />
              ) : (
                <span className="font-mono text-sm">{teardownDraft ? `$${teardownDraft}` : "Not offered"}</span>
              )}
            </div>
            {isAdmin && (
              <Button type="submit" disabled={isPending} className="w-fit">
                {isPending ? "Saving..." : "Save Pricing"}
              </Button>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// The "sent" half of the plan's "sent/viewed/accepted rollup" — see
// api.myOrganization.listQuotes's own comment. The header says exactly
// that, on purpose, rather than implying a fuller status view exists.
function SentQuotesSection() {
  const { data: quotes, isLoading } = useOrganizationQuotes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Sent Quotes
        </CardTitle>
        <CardDescription>
          Every quote this business has sent. Just "sent" for now — viewed/accepted tracking isn't built yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading sent quotes...</div>
        ) : !quotes || quotes.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border-2 border-dashed rounded-lg">
            No quotes sent yet — send one from a project's "Send Quote to Customer" button.
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Customer</th>
                  <th className="text-left px-4 py-2.5 font-medium">Project</th>
                  <th className="text-left px-4 py-2.5 font-medium">Amount</th>
                  <th className="text-left px-4 py-2.5 font-medium">Sent by</th>
                  <th className="text-left px-4 py-2.5 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-t border-border">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{q.customerName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{q.customerEmail}</div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{q.projectName}</td>
                    <td className="px-4 py-2.5 font-mono">${q.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{q.createdByEmail || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(q.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessContent({ userId }: { userId: string }) {
  const { data: myOrg, isLoading } = useMyOrganization();

  if (isLoading) {
    return <div className="max-w-3xl mx-auto p-4 md:p-8 text-muted-foreground">Loading your business...</div>;
  }

  if (!myOrg) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>You're not part of a business yet</CardTitle>
            <CardDescription>
              A platform admin adds businesses today — if you're expecting to see one here, check with whoever set up your account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isAdmin = myOrg.role === "admin";

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> {myOrg.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your team and see what's been sent. Business contact info lives on{" "}
            <Link href="/account" className="underline decoration-dotted underline-offset-2 hover:text-primary">
              your Account page
            </Link>.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Logo
          </CardTitle>
          <CardDescription>Shown on your dashboard and on every quote this business sends.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload logoData={myOrg.logoData} isAdmin={isAdmin} />
        </CardContent>
      </Card>
      <PricingSection isAdmin={isAdmin} teardownRatePerFoot={myOrg.teardownRatePerFoot} />
      <RosterSection isAdmin={isAdmin} currentUserId={userId} />
      <SentQuotesSection />
    </div>
  );
}

export default function Business() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (!loading && !isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (loading || !user) {
    return <Layout><div className="max-w-3xl mx-auto p-4 md:p-8 text-muted-foreground">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <BusinessContent userId={user.id} />
    </Layout>
  );
}
