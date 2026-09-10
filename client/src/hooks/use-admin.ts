import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Admin panel hooks — read-only, server-side gated on users.isAdmin
// (see server/routes.ts's `isAdmin` middleware; a 403 here means the
// client-side redirect in Admin.tsx/AdminUserDetail.tsx has a bug, not
// that the check itself lives here).

export function useAdminUsers() {
  return useQuery({
    queryKey: [api.admin.listUsers.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listUsers.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.admin.listUsers.responses[200].parse(await res.json());
    },
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: [api.admin.getUser.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.admin.getUser.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.admin.getUser.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// One project's real fence-line detail + computed materials estimate —
// same shape a user's own editor sidebar shows, fetched cross-user via
// the admin-only route. `enabled: !!id` (not passed `isGuest`/ownership
// options like the regular useProject) since admin access itself is the
// only gate here.
export function useAdminProject(id: number | undefined) {
  return useQuery({
    queryKey: [api.admin.getProject.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.admin.getProject.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.admin.getProject.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Real, permanent delete — the user AND every property/project/fence
// line they own (server/storage.ts's deleteUserAndData). Server-side
// 400s if the target is the admin's own account; that's surfaced as a
// thrown Error here so the caller's own confirm-dialog flow can show
// it, same as any other mutation error in this app.
export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.admin.deleteUser.path, { id });
      const res = await fetch(url, { method: api.admin.deleteUser.method, credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      toast({ title: "Deleted", description: "Account and all its data removed.", variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't delete account", description: error.message, variant: "destructive" });
    },
  });
}

// The two possible responses to a pending Pro request — see
// AdminUserDetail.tsx's "Pro access requested" banner. Both invalidate
// getUser (this target's own detail fetch) and listUsers (the table's
// plan/pending column), same pattern useAdminDeleteUser already uses.
export function useAdminApprovePro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.admin.approvePro.path, { id });
      const res = await fetch(url, { method: api.admin.approvePro.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getUser.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      toast({ title: "Approved", description: "This account now has Pro access.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Couldn't approve", description: "Something went wrong. Try again.", variant: "destructive" });
    },
  });
}

export function useAdminDismissProRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.admin.dismissProRequest.path, { id });
      const res = await fetch(url, { method: api.admin.dismissProRequest.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to dismiss");
      return res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getUser.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      toast({ title: "Dismissed", description: "The request was cleared without granting Pro.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Couldn't dismiss", description: "Something went wrong. Try again.", variant: "destructive" });
    },
  });
}

export function useAdminEvents() {
  return useQuery({
    queryKey: [api.admin.listEvents.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listEvents.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.admin.listEvents.responses[200].parse(await res.json());
    },
  });
}

// Business tier admin routes — all built in Phase 0 (2026-09-10) but
// never given a client UI until now (see CLAUDE.md's Phase 0 write-up:
// "business-facing UI... today this is API/DB-only, run by a platform
// admin"). This is that gap closed: the org list/detail/create/roster
// mutations themselves are unchanged from Phase 0, only the client side
// is new.

export function useAdminOrganizations() {
  return useQuery({
    queryKey: [api.admin.listOrganizations.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listOrganizations.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch businesses");
      return api.admin.listOrganizations.responses[200].parse(await res.json());
    },
  });
}

// { organization, members } — the same shape AdminUserDetail's own
// project-detail fetch returns a paired object, not two round trips.
export function useAdminOrganization(id: number | undefined) {
  return useQuery({
    queryKey: [api.admin.getOrganization.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.admin.getOrganization.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch business");
      return api.admin.getOrganization.responses[200].parse(await res.json()) as { organization: any; members: any[] };
    },
    enabled: !!id,
  });
}

export function useAdminCreateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; firstAdminEmail: string }) => {
      const validated = api.admin.createOrganization.input.parse(data);
      const res = await fetch(api.admin.createOrganization.path, {
        method: api.admin.createOrganization.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create business");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listOrganizations.path] });
      toast({ title: "Created", description: "The business is set up — its first admin has Pro access now.", variant: "success" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAdminAddOrganizationMember(organizationId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { email: string; role: "admin" | "member" }) => {
      if (!organizationId) throw new Error("No business selected");
      const validated = api.admin.addOrganizationMember.input.parse(data);
      const url = buildUrl(api.admin.addOrganizationMember.path, { id: organizationId });
      const res = await fetch(url, {
        method: api.admin.addOrganizationMember.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to add member");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getOrganization.path, organizationId] });
      queryClient.invalidateQueries({ queryKey: [api.admin.listOrganizations.path] });
      toast({ title: "Added", description: "They're on the roster with Pro access.", variant: "success" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAdminUpdateOrganizationMemberRole(organizationId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
      if (!organizationId) throw new Error("No business selected");
      const url = buildUrl(api.admin.updateOrganizationMemberRole.path, { id: organizationId, userId });
      const res = await fetch(url, {
        method: api.admin.updateOrganizationMemberRole.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update role");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getOrganization.path, organizationId] });
      toast({ title: "Saved", description: "Their role has been updated.", variant: "success" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAdminRemoveOrganizationMember(organizationId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!organizationId) throw new Error("No business selected");
      const url = buildUrl(api.admin.removeOrganizationMember.path, { id: organizationId, userId });
      const res = await fetch(url, { method: api.admin.removeOrganizationMember.method, credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to remove member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getOrganization.path, organizationId] });
      queryClient.invalidateQueries({ queryKey: [api.admin.listOrganizations.path] });
      toast({ title: "Removed", description: "They're off the roster.", variant: "success" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
