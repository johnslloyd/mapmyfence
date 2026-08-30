import { calculateEstimate } from "./estimates";
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { IStorage } from "./storage";
import { api, FREE_PROPERTY_LIMIT } from "@shared/routes";
import { z } from "zod";
import { logEvent } from "./events";
import { lookupParcel } from "./parcels";

// Middleware to check if the user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Gates every /api/admin/* route. Deliberately checked here — server
// side, on every request — rather than only hiding the /admin nav link
// client-side; a hidden link is not access control. 403, not 404: an
// authenticated non-admin gets a clear "not allowed" rather than a
// deceptive "doesn't exist" (this app has no reason to hide that admin
// routes exist at all, only to enforce who can use them).
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// FREE_PROPERTY_LIMIT (shared/routes.ts): Pro (users.plan === "pro",
// self-serve and free during beta — see POST /api/account/upgrade in
// authRoutes.ts) is unlimited. Only enforced for AUTHENTICATED property
// creation — a guest's flow always ends in claiming exactly one property
// at signup, so there's no meaningful "free tier" concept before that
// point.

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  storage: IStorage
): Promise<Server> {

  app.get(api.projects.getEstimates.path, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const project = await storage.getProject(projectId, (req.user as any)?.id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const totalLength = project.fenceLines.reduce((acc, line) => acc + (line.length || 0), 0);

      if (totalLength === 0) {
          return res.json({ options: [] });
      }

      // Pass each line's own material AND height through — a project can
      // mix pine/cedar and 6ft/8ft lines, and calculateEstimate prices
      // each (species, height) combination separately rather than
      // assuming the whole project is one material at one height.
      // Gates are flattened across every line in the project — the BOM
      // only cares how many single vs. double gates exist in total, not
      // which line each one sits on.
      const estimate = await calculateEstimate(
        project.fenceLines.map((line) => ({ length: line.length || 0, material: line.material, height: line.height })),
        project.fenceLines.flatMap((line) => (line.gates || []).map((g) => ({ type: g.type }))),
      );

      logEvent("estimate_viewed", { projectId, userId: (req.user as any)?.id });
      res.json(estimate);
    } catch (err: any) {
      console.error('Failed to get estimates', err);
      res.status(500).json({ message: err.message || 'Failed to get estimates' });
    }
  });

  app.get(api.parcels.lookup.path, async (req, res) => {
    const latLngSchema = z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
    });
    const parsed = latLngSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "lat and lng query params are required" });
    }

    try {
      const result = await lookupParcel(parsed.data.lat, parsed.data.lng);
      res.json(result);
    } catch (err: any) {
      console.error('Failed to look up parcel', err);
      res.status(500).json({ message: err.message || 'Failed to look up parcel' });
    }
  });

  // === PROPERTIES ===

  app.get(api.properties.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const props = await storage.getProperties(user.id);
      res.json(props);
    } catch (err) {
      console.error('Failed to list properties', err);
      res.status(500).json({ message: 'Failed to list properties' });
    }
  });

  app.get(api.properties.get.path, async (req, res) => {
    try {
      const user = req.user as any;
      const propertyId = Number(req.params.id);
      let property;

      if (req.isAuthenticated()) {
        property = await storage.getProperty(propertyId, user.id);
      } else {
        // For guests, only allow if the guest flag is present — a basic
        // security measure to prevent open access to all guest properties.
        if (req.query.guest === 'true') {
          property = await storage.getProperty(propertyId);
        }
      }

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      console.error('Failed to get property', err);
      res.status(500).json({ message: 'Failed to get property' });
    }
  });

  app.post(api.properties.create.path, async (req, res) => {
    try {
      const user = req.user as any;
      const input = api.properties.create.input.parse(req.body);
      const userId = req.isAuthenticated() && user ? user.id : null;

      if (userId && user.plan !== "pro") {
        const existing = await storage.getProperties(userId);
        if (existing.length >= FREE_PROPERTY_LIMIT) {
          return res.status(400).json({
            message: `Free accounts are limited to ${FREE_PROPERTY_LIMIT} properties. Upgrade to Pro (free during beta) on your Account page for unlimited properties.`,
          });
        }
      }

      const property = await storage.createProperty({ ...input, userId });
      logEvent("property_created", { propertyId: property.id, userId: userId || undefined });

      // Auto-create the property's first project (type: fence) so
      // creating a property still feels exactly like creating a project
      // did before this restructure — zero added friction for the only
      // vertical that's actually live. A second/third project (another
      // fence plan, or eventually lawn care) is opt-in via the property
      // page's own "+ Add Project" action, not forced here.
      const project = await storage.createProject({
        propertyId: property.id,
        type: "fence",
        name: property.address ? `New Fence at ${property.address}` : "New Fence Line",
        status: "planning",
      });
      logEvent("project_created", { propertyId: property.id, projectId: project.id, userId: userId || undefined });

      res.status(201).json({ ...property, projects: [project] });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Failed to create property', err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.properties.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.properties.update.input.parse(req.body);
      const property = await storage.updateProperty(Number(req.params.id), input);
      res.json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.properties.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteProperty(Number(req.params.id));
    res.status(204).end();
  });

  // === PROJECTS ===

  app.get(api.projects.get.path, async (req, res) => {
    try {
      const user = req.user as any;
      const projectId = Number(req.params.id);
      let project;

      if (req.isAuthenticated()) {
        project = await storage.getProject(projectId, user.id);
      } else {
        if (req.query.guest === 'true') {
          project = await storage.getProject(projectId);
        }
      }

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (err) {
      console.error('Failed to get project', err);
      res.status(500).json({ message: 'Failed to get project' });
    }
  });

  app.post(api.projects.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const propertyId = Number(req.params.propertyId);
      const project = await storage.createProject({ ...input, propertyId });
      logEvent("project_created", { propertyId, projectId: project.id, userId: (req.user as any)?.id });
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Failed to create project', err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.projects.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input);
      res.json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.projects.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).end();
  });

  // === FENCE LINES ===

  app.post(api.fenceLines.create.path, isAuthenticated, async (req, res) => {
    try {
      const { coordinates, ...rest } = api.fenceLines.create.input.parse(req.body);
      const line = await storage.createFenceLine(Number(req.params.projectId), { ...rest, projectId: Number(req.params.projectId) }, coordinates);
      logEvent("fence_line_created", { projectId: Number(req.params.projectId), userId: (req.user as any)?.id });
      res.status(201).json(line);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.fenceLines.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteFenceLine(Number(req.params.id));
    res.status(204).end();
  });

  app.put(api.fenceLines.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.fenceLines.update.input.parse(req.body);
      const line = await storage.updateFenceLine(Number(req.params.id), input);
      res.json(line);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === GATES ===
  // Same auth model as fence lines: gate placement only happens once a
  // line is saved and being edited (see MapEditorComponent), and a
  // guest never reaches this endpoint directly — their pending line
  // (and any gates they'd add) isn't POSTed to the server until signup,
  // same as fence line creation.

  app.post(api.gates.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.gates.create.input.parse(req.body);
      const gate = await storage.createGate(Number(req.params.fenceLineId), input);
      res.status(201).json(gate);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Failed to create gate', err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.gates.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteGate(Number(req.params.id));
    res.status(204).end();
  });

  // === ADMIN ===
  // Read-only (see CLAUDE.md's "Admin panel" section for why) and
  // audit-logged — every view here fires its own `admin_*` event
  // (server/events.ts), the same funnel-logging mechanism as everything
  // else, so "who looked at what, and when" is never a separate system
  // to maintain.

  app.get(api.admin.listUsers.path, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const usersList = await storage.getAllUsersWithCounts();
      logEvent("admin_viewed_users", { userId: adminId });
      res.json(usersList);
    } catch (err) {
      console.error('Failed to list users', err);
      res.status(500).json({ message: 'Failed to list users' });
    }
  });

  app.get(api.admin.getUser.path, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const targetId = req.params.id;
      const targetUser = await storage.getUserById(targetId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      // Same shape a user sees on their own /properties — just fetched
      // for someone else's id instead of the requester's own.
      const userProperties = await storage.getProperties(targetId);
      logEvent("admin_viewed_user", { userId: adminId, targetUserId: targetId });
      res.json({ user: targetUser, properties: userProperties });
    } catch (err) {
      console.error('Failed to get user', err);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.get(api.admin.listEvents.path, isAdmin, async (req, res) => {
    try {
      const recentEvents = await storage.getRecentEvents(200);
      // Deliberately NOT logged as its own audit event — the events
      // feed IS the audit trail; logging every glance at it would just
      // fill it with itself.
      res.json(recentEvents);
    } catch (err) {
      console.error('Failed to list events', err);
      res.status(500).json({ message: 'Failed to list events' });
    }
  });

  return httpServer;
}
