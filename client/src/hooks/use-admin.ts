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
