import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

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
