import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { insertPropertySchema } from "@shared/schema";
import {
  type PropertyWithProjects,
  type InsertProperty,
  type ProjectWithLines,
  type InsertProject,
  type InsertFenceLine,
  type InsertCoordinate,
  type AddFenceLineRequest
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ============================================
// PROPERTIES
// ============================================

export function useProperties(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [api.properties.list.path],
    queryFn: async () => {
      const res = await fetch(api.properties.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return api.properties.list.responses[200].parse(await res.json()) as unknown as PropertyWithProjects[];
    },
    ...options,
  });
}

export function useProperty(id: number | undefined, options?: { enabled?: boolean; isGuest?: boolean }) {
  return useQuery({
    queryKey: [api.properties.get.path, id, options?.isGuest],
    queryFn: async () => {
      if (!id || isNaN(id)) return null;
      let url = buildUrl(api.properties.get.path, { id });
      if (options?.isGuest) {
        url += '?guest=true';
      }
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch property");
      return api.properties.get.responses[200].parse(await res.json()) as unknown as PropertyWithProjects;
    },
    enabled: !!id && !isNaN(id) && (options?.enabled === undefined || options.enabled),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProperty) => {
      // parse with a schema that omits userId (server injects it)
      const validated = insertPropertySchema.omit({ userId: true }).parse(data);
      const res = await fetch(api.properties.create.path, {
        method: api.properties.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.properties.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create property');
      }
      // Server auto-creates the property's first (fence) project in the
      // same request, so this already comes back with `projects: [...]`
      // populated — no second round trip needed to find where to land.
      return api.properties.create.responses[201].parse(await res.json()) as unknown as PropertyWithProjects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      toast({ title: "Success", description: "Property created successfully", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertProperty>) => {
      const validated = api.properties.update.input.parse(data);
      const url = buildUrl(api.properties.update.path, { id });

      const res = await fetch(url, {
        method: api.properties.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error('Failed to update property');
      return api.properties.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, id] });
      toast({ title: "Saved", description: "Property updated", variant: "success" });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.properties.delete.path, { id });
      const res = await fetch(url, {
        method: api.properties.delete.method,
        credentials: "include"
      });

      if (!res.ok) throw new Error('Failed to delete property');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      toast({ title: "Deleted", description: "Property removed successfully", variant: "success" });
    },
  });
}

// ============================================
// PROJECTS (typed units of work under a property — what the fence
// editor is actually keyed on)
// ============================================

export function useProject(id: number | undefined, options?: { enabled?: boolean; isGuest?: boolean }) {
  return useQuery({
    queryKey: [api.projects.get.path, id, options?.isGuest],
    queryFn: async () => {
      if (!id || isNaN(id)) return null;
      let url = buildUrl(api.projects.get.path, { id });
      if (options?.isGuest) {
        url += '?guest=true';
      }
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.projects.get.responses[200].parse(await res.json()) as unknown as ProjectWithLines;
    },
    enabled: !!id && !isNaN(id) && (options?.enabled === undefined || options.enabled),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ propertyId, ...data }: { propertyId: number } & Omit<InsertProject, "propertyId">) => {
      const validated = api.projects.create.input.parse(data);
      const url = buildUrl(api.projects.create.path, { propertyId });
      const res = await fetch(url, {
        method: api.projects.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.projects.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create project');
      }
      return api.projects.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, propertyId] });
      toast({ title: "Success", description: "Project created successfully", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Omit<InsertProject, "propertyId">>) => {
      const validated = api.projects.update.input.parse(data);
      const url = buildUrl(api.projects.update.path, { id });

      const res = await fetch(url, {
        method: api.projects.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error('Failed to update project');
      return api.projects.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, id] });
      toast({ title: "Saved", description: "Project updated", variant: "success" });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: number; propertyId: number }) => {
      const url = buildUrl(api.projects.delete.path, { id });
      const res = await fetch(url, {
        method: api.projects.delete.method,
        credentials: "include"
      });

      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, propertyId] });
      toast({ title: "Deleted", description: "Project removed successfully", variant: "success" });
    },
  });
}

// ============================================
// ESTIMATES
// ============================================

export function useEstimates(projectId: number | undefined) {
  return useQuery({
    queryKey: [api.projects.getEstimates.path, projectId],
    queryFn: async () => {
      if (!projectId || isNaN(projectId)) return null;
      const url = buildUrl(api.projects.getEstimates.path, { id: projectId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch estimates");
      return api.projects.getEstimates.responses[200].parse(await res.json());
    },
    enabled: !!projectId && !isNaN(projectId),
  });
}

// ============================================
// PARCELS (property line lookup — Mississippi only for now)
// ============================================

export function useParcelLookup() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const url = `${api.parcels.lookup.path}?lat=${lat}&lng=${lng}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to look up property line");
      return api.parcels.lookup.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// FENCE LINES
// ============================================

export function useCreateFenceLine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, ...data }: { projectId: number } & Omit<AddFenceLineRequest, "projectId">) => {
      const validated = api.fenceLines.create.input.parse(data);
      const url = buildUrl(api.fenceLines.create.path, { projectId });

      const res = await fetch(url, {
        method: api.fenceLines.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error('Failed to save fence line');
      return api.fenceLines.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      // refetchType: 'all' (not the default 'active') — MaterialEstimates,
      // which owns this query, is UNMOUNTED whenever the right panel is
      // showing the drawing/editing card instead of the sidebar, so at the
      // moment this fires the query has no active observer. Without this,
      // invalidateQueries only marks it stale and waits for the next
      // mount to lazily refetch — meaning the panel can remount showing
      // briefly-stale cached data (e.g. the previous material's product)
      // before the background refetch resolves. Forcing the refetch now,
      // while still unmounted, means the cache is already fresh by the
      // time the panel remounts.
      queryClient.invalidateQueries({ queryKey: [api.projects.getEstimates.path, projectId], refetchType: 'all' });
      toast({ title: "Success", description: "Fence line saved", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteFenceLine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number, projectId: number }) => {
      const url = buildUrl(api.fenceLines.delete.path, { id });
      const res = await fetch(url, {
        method: api.fenceLines.delete.method,
        credentials: "include"
      });

      if (!res.ok) throw new Error('Failed to delete fence line');
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      // refetchType: 'all' (not the default 'active') — MaterialEstimates,
      // which owns this query, is UNMOUNTED whenever the right panel is
      // showing the drawing/editing card instead of the sidebar, so at the
      // moment this fires the query has no active observer. Without this,
      // invalidateQueries only marks it stale and waits for the next
      // mount to lazily refetch — meaning the panel can remount showing
      // briefly-stale cached data (e.g. the previous material's product)
      // before the background refetch resolves. Forcing the refetch now,
      // while still unmounted, means the cache is already fresh by the
      // time the panel remounts.
      queryClient.invalidateQueries({ queryKey: [api.projects.getEstimates.path, projectId], refetchType: 'all' });
      toast({ title: "Deleted", description: "Fence line removed", variant: "success" });
    },
  });
}

export function useUpdateFenceLine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId, ...data }: { id: number, projectId: number } & Partial<InsertFenceLine & { coordinates: Omit<InsertCoordinate, "fenceLineId">[] }>) => {
      const validated = api.fenceLines.update.input.parse(data);
      const url = buildUrl(api.fenceLines.update.path, { id });

      const res = await fetch(url, {
        method: api.fenceLines.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error('Failed to update fence line');
      return api.fenceLines.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      // refetchType: 'all' (not the default 'active') — MaterialEstimates,
      // which owns this query, is UNMOUNTED whenever the right panel is
      // showing the drawing/editing card instead of the sidebar, so at the
      // moment this fires the query has no active observer. Without this,
      // invalidateQueries only marks it stale and waits for the next
      // mount to lazily refetch — meaning the panel can remount showing
      // briefly-stale cached data (e.g. the previous material's product)
      // before the background refetch resolves. Forcing the refetch now,
      // while still unmounted, means the cache is already fresh by the
      // time the panel remounts.
      queryClient.invalidateQueries({ queryKey: [api.projects.getEstimates.path, projectId], refetchType: 'all' });
      toast({ title: "Saved", description: "Fence line updated", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// ============================================
// GATES — placed on a fence line, not user-drawn (see
// MapEditorComponent's gate-placement mode and shared/schema.ts's
// `gates` table comment).
// ============================================

type GatePosition = { type: "single" | "double"; segmentIndex: number; position: number };

export function useCreateGate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ fenceLineId, projectId, ...data }: { fenceLineId: number; projectId: number } & GatePosition) => {
      const validated = api.gates.create.input.parse(data);
      const url = buildUrl(api.gates.create.path, { fenceLineId });

      const res = await fetch(url, {
        method: api.gates.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error('Failed to add gate');
      return api.gates.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      // Same refetchType: 'all' reasoning as the fence-line mutations
      // above — MaterialEstimates can be unmounted (right panel showing
      // the editing card, not the sidebar) when a gate is added, and a
      // gate directly changes the estimate (new hardware line item).
      queryClient.invalidateQueries({ queryKey: [api.projects.getEstimates.path, projectId], refetchType: 'all' });
      toast({ title: "Success", description: "Gate added", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteGate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
      const url = buildUrl(api.gates.delete.path, { id });
      const res = await fetch(url, {
        method: api.gates.delete.method,
        credentials: "include"
      });

      if (!res.ok) throw new Error('Failed to remove gate');
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, projectId] });
      queryClient.invalidateQueries({ queryKey: [api.projects.getEstimates.path, projectId], refetchType: 'all' });
      toast({ title: "Deleted", description: "Gate removed", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// ============================================
// ACCOUNT — self-serve, free during beta (see FREE_PROPERTY_LIMIT and
// api.account.upgrade in shared/routes.ts). Pulled out as a shared hook
// so the Account page's Plan card and AddPropertyDialog's at-the-limit
// prompt don't each hand-roll the same fetch.
// ============================================

export function useUpgradeToPro() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.account.upgrade.path, { method: api.account.upgrade.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to upgrade");
      return api.account.upgrade.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "You're on Pro", description: "Unlimited properties, free during beta.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Error", description: "Couldn't upgrade right now. Try again in a moment.", variant: "destructive" });
    },
  });
}
