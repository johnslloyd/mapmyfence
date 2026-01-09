import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { insertProjectSchema } from "@shared/schema";
import { 
  type ProjectWithLines, 
  type InsertProject, 
  type InsertFenceLine,
  type AddFenceLineRequest 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ============================================
// PROJECTS
// ============================================

export function useProjects(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [api.projects.list.path],
    queryFn: async () => {
      const res = await fetch(api.projects.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return api.projects.list.responses[200].parse(await res.json());
    },
    ...options,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: [api.projects.get.path, id],
    queryFn: async () => {
      if (isNaN(id)) return null;
      const url = buildUrl(api.projects.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.projects.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProject) => {
      // parse with a schema that omits userId (server injects it)
      const validated = insertProjectSchema.omit({ userId: true }).parse(data);
      const res = await fetch(api.projects.create.path, {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
      toast({ title: "Success", description: "Project created successfully" });
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
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertProject>) => {
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
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, id] });
      toast({ title: "Saved", description: "Project updated" });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.projects.delete.path, { id });
      const res = await fetch(url, { 
        method: api.projects.delete.method, 
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
      toast({ title: "Deleted", description: "Project removed successfully" });
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
      toast({ title: "Success", description: "Fence line saved" });
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
      toast({ title: "Deleted", description: "Fence line removed" });
    },
  });
}
