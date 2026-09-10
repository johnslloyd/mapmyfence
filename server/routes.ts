import { calculateEstimate } from "./estimates";
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { IStorage, LastAdminError, DuplicateMemberError } from "./storage";
import { api, FREE_PROPERTY_LIMIT } from "@shared/routes";
import { z } from "zod";
import { logEvent } from "./events";
import { lookupParcel, ParcelServiceUnavailableError } from "./parcels";
import { sendEmail } from "./email";
import crypto from "crypto";

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
      if (err instanceof ParcelServiceUnavailableError) {
        // Distinct from the generic 500 below — this is a known,
        // named condition (the upstream service is down), not an
        // unexpected server error, so it gets its own status and a
        // message safe to show the user directly.
        return res.status(503).json({ message: err.message });
      }
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

      // isUserPro, not a raw user.plan check — a business's members are
      // Pro automatically for as long as they're on the roster (see
      // shared/schema.ts's organizationMembers comment), not just
      // personally-approved accounts.
      if (userId && !(await storage.isUserPro(userId))) {
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

  app.delete(api.admin.deleteUser.path, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const targetId = req.params.id;
      // The one guard this route enforces itself: can't delete your
      // own account through the admin panel — a slip here would lock
      // an admin out of their own account with no self-serve way back
      // in, a much worse failure mode than the same click on any other
      // user's row.
      if (targetId === adminId) {
        return res.status(400).json({ message: "You can't delete your own account from here." });
      }
      const targetUser = await storage.getUserById(targetId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.deleteUserAndData(targetId);
      // targetUserId here points at a user row that no longer exists
      // the instant after this — fine, events.targetUserId carries no
      // FK constraint (see storage.deleteUserAndData's own comment),
      // so this is a legitimate historical record of who was deleted,
      // not a reference the audit trail ever expects to still resolve.
      logEvent("admin_deleted_user", { userId: adminId, targetUserId: targetId });
      res.status(204).end();
    } catch (err) {
      console.error('Failed to delete user', err);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // The two possible responses to a pending Pro request (see
  // POST /api/account/upgrade in authRoutes.ts, which sets it). Both
  // real admin ACTIONS, not views — logged the same way admin_deleted_user
  // already is.
  app.post(api.admin.approvePro.path, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const targetId = req.params.id;
      const targetUser = await storage.getUserById(targetId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updated = await storage.approveProUpgrade(targetId);
      logEvent("admin_approved_pro", { userId: adminId, targetUserId: targetId });
      res.json(updated);
    } catch (err) {
      console.error('Failed to approve Pro request', err);
      res.status(500).json({ message: 'Failed to approve Pro request' });
    }
  });

  app.post(api.admin.dismissProRequest.path, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const targetId = req.params.id;
      const targetUser = await storage.getUserById(targetId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updated = await storage.dismissProRequest(targetId);
      logEvent("admin_dismissed_pro_request", { userId: adminId, targetUserId: targetId });
      res.json(updated);
    } catch (err) {
      console.error('Failed to dismiss Pro request', err);
      res.status(500).json({ message: 'Failed to dismiss Pro request' });
    }
  });

  // === BUSINESS TIER, PHASE 0 — Staff-only org CRUD ===
  // No self-serve or business-owner-facing equivalent exists yet — see
  // CLAUDE.md's "PostPlotter for Business" section. This is how a pilot
  // business gets onboarded manually today, not the eventual in-product
  // flow. Members are always addressed by email, never a raw user id.

  app.get(api.admin.listOrganizations.path, isAdmin, async (req, res) => {
    try {
      const orgs = await storage.getAllOrganizationsWithCounts();
      res.json(orgs);
    } catch (err) {
      console.error('Failed to list organizations', err);
      res.status(500).json({ message: 'Failed to list organizations' });
    }
  });

  app.get(api.admin.getOrganization.path, isAdmin, async (req, res) => {
    try {
      const orgId = Number(req.params.id);
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Business not found" });
      }
      const members = await storage.getOrganizationMembers(orgId);
      res.json({ organization: org, members });
    } catch (err) {
      console.error('Failed to get organization', err);
      res.status(500).json({ message: 'Failed to get organization' });
    }
  });

  app.post(api.admin.createOrganization.path, isAdmin, async (req, res) => {
    try {
      const input = api.admin.createOrganization.input.parse(req.body);
      const firstAdmin = await storage.getUserByEmail(input.firstAdminEmail);
      if (!firstAdmin) {
        return res.status(404).json({ message: `No account found for ${input.firstAdminEmail} — they need to sign up for a free PostPlotter account first.` });
      }
      const org = await storage.createOrganization(input.name, firstAdmin.id);
      res.status(201).json(org);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
      }
      console.error('Failed to create organization', err);
      res.status(500).json({ message: 'Failed to create organization' });
    }
  });

  app.post(api.admin.addOrganizationMember.path, isAdmin, async (req, res) => {
    try {
      const orgId = Number(req.params.id);
      const input = api.admin.addOrganizationMember.input.parse(req.body);
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Business not found" });
      }
      const target = await storage.getUserByEmail(input.email);
      if (!target) {
        return res.status(404).json({ message: `No account found for ${input.email} — they need to sign up for a free PostPlotter account first.` });
      }
      const member = await storage.addOrganizationMember(orgId, target.id, input.role);
      res.status(201).json(member);
    } catch (err: any) {
      if (err instanceof DuplicateMemberError) {
        return res.status(400).json({ message: err.message });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
      }
      console.error('Failed to add organization member', err);
      res.status(500).json({ message: 'Failed to add organization member' });
    }
  });

  app.put(api.admin.updateOrganizationMemberRole.path, isAdmin, async (req, res) => {
    try {
      const orgId = Number(req.params.id);
      const targetUserId = req.params.userId;
      const input = api.admin.updateOrganizationMemberRole.input.parse(req.body);
      const updated = await storage.updateOrganizationMemberRole(orgId, targetUserId, input.role);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof LastAdminError) {
        return res.status(400).json({ message: err.message });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
      }
      console.error('Failed to update member role', err);
      res.status(500).json({ message: 'Failed to update member role' });
    }
  });

  app.delete(api.admin.removeOrganizationMember.path, isAdmin, async (req, res) => {
    try {
      const orgId = Number(req.params.id);
      const targetUserId = req.params.userId;
      await storage.removeOrganizationMember(orgId, targetUserId);
      res.status(204).end();
    } catch (err: any) {
      if (err instanceof LastAdminError) {
        return res.status(400).json({ message: err.message });
      }
      console.error('Failed to remove organization member', err);
      res.status(500).json({ message: 'Failed to remove organization member' });
    }
  });

  // === BUSINESS TIER, PHASE 1 — the org member's own "my business" +
  // quote-send routes. Unlike everything under api.admin.* above, these
  // are gated on real org membership (via storage.getUserOrganizations),
  // not users.isAdmin — a platform Staff account and a business's own
  // admin are two different roles, see shared/schema.ts's organizations
  // comment. ===

  app.get(api.myOrganization.get.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orgs = await storage.getUserOrganizations(userId);
      // First/only org — see api.myOrganization's own comment on this
      // simplification. Real multi-org support (a picker) is Phase 2.
      res.json(orgs[0] || null);
    } catch (err: any) {
      console.error('Failed to get my organization', err);
      res.status(500).json({ message: 'Failed to load your business' });
    }
  });

  app.put(api.myOrganization.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.myOrganization.update.input.parse(req.body);
      const orgs = await storage.getUserOrganizations(userId);
      const org = orgs[0];
      if (!org) {
        return res.status(403).json({ message: "You're not part of a business yet." });
      }
      if (org.role !== "admin") {
        return res.status(403).json({ message: "Only a business admin can edit its contact info." });
      }
      const updated = await storage.updateOrganizationProfile(org.id, input);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
      }
      console.error('Failed to update my organization', err);
      res.status(500).json({ message: 'Failed to update your business' });
    }
  });

  app.post(api.quotes.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const projectId = Number(req.params.id);
      const input = api.quotes.create.input.parse(req.body);

      const orgs = await storage.getUserOrganizations(userId);
      const org = orgs[0];
      if (!org) {
        return res.status(403).json({ message: "Sending a quote requires being part of a business — this is a Pro/DIY account today." });
      }

      // Ownership-gated the same way GET /api/projects/:id/estimates
      // already is — a quote is sent off a project the sender actually
      // has access to, same as viewing its estimate. This app doesn't
      // (yet) let one business member send a quote for another
      // member's own project — see CLAUDE.md's Phase 1 write-up.
      const project = await storage.getProject(projectId, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const totalLinearFeet = project.fenceLines.reduce((acc, line) => acc + (line.length || 0), 0);
      if (totalLinearFeet === 0) {
        return res.status(400).json({ message: "Draw at least one fence line before sending a quote." });
      }

      // Same calculateEstimate call every other estimate view already
      // uses — the bottom-line number is the cheapest store's real
      // total, not a separately-computed "quote price." Markup/labor
      // are explicitly NOT part of Phase 1 (see the plan doc) — this is
      // the real material cost, presented as a linear-foot rate and a
      // bottom line instead of an itemized list.
      const estimate = await calculateEstimate(
        project.fenceLines.map((line) => ({ length: line.length || 0, material: line.material, height: line.height })),
        project.fenceLines.flatMap((line) => (line.gates || []).map((g) => ({ type: g.type }))),
      );
      const cheapest = estimate.options[0];
      if (!cheapest) {
        return res.status(400).json({ message: "No store can currently price every material this project needs — can't generate a quote yet." });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const quote = await storage.createQuote({
        projectId,
        organizationId: org.id,
        createdByUserId: userId,
        customerName: input.customerName ?? null,
        customerEmail: input.customerEmail,
        // Snapshotted from the business's CURRENT profile at send
        // time — see quotes' own schema comment for why this isn't a
        // live join instead.
        businessName: org.name,
        businessPhone: org.phone ?? null,
        businessEmail: org.email ?? null,
        totalLinearFeet,
        totalCost: cheapest.totalCost,
        tokenHash,
      });

      const origin = `${req.protocol}://${req.get("host")}`;
      const publicUrl = `${origin}/quotes/${rawToken}`;
      const pricePerFoot = quote.totalCost / quote.totalLinearFeet;

      const emailSent = await sendEmail({
        to: input.customerEmail,
        subject: `Your fence quote from ${org.name}`,
        text: `${org.name} sent you a fence quote for ${project.name}: ${totalLinearFeet.toFixed(0)} ft at $${pricePerFoot.toFixed(2)}/ft — $${quote.totalCost.toFixed(2)} total.\n\nView it here:\n${publicUrl}`,
        html: `<p><strong>${org.name}</strong> sent you a fence quote for <strong>${project.name}</strong>:</p><p>${totalLinearFeet.toFixed(0)} ft at $${pricePerFoot.toFixed(2)}/ft &mdash; <strong>$${quote.totalCost.toFixed(2)} total</strong></p><p><a href="${publicUrl}">View your quote</a></p>`,
      });

      res.status(201).json({ quote, publicUrl, emailSent });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message || "Invalid input" });
      }
      console.error('Failed to create quote', err);
      res.status(500).json({ message: 'Failed to create quote' });
    }
  });

  // The one route in this entire app meant to be reachable with NO
  // session at all — same shape as /api/reset-password's token-redeem
  // route. Looks up by tokenHash (never the raw token — see quotes'
  // schema comment), and returns only what a customer actually needs to
  // see: business branding + the linear-foot/bottom-line numbers. No
  // internal ids beyond what's already public in the URL itself.
  app.get(api.quotes.getPublic.path, async (req, res) => {
    try {
      const rawToken = req.params.token;
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const quote = await storage.getQuoteByTokenHash(tokenHash);
      if (!quote) {
        return res.status(404).json({ message: "This quote link isn't valid." });
      }
      res.json({
        customerName: quote.customerName,
        businessName: quote.businessName,
        businessPhone: quote.businessPhone,
        businessEmail: quote.businessEmail,
        totalLinearFeet: quote.totalLinearFeet,
        totalCost: quote.totalCost,
        createdAt: quote.createdAt,
      });
    } catch (err: any) {
      console.error('Failed to get public quote', err);
      res.status(500).json({ message: 'Failed to load quote' });
    }
  });

  app.get(api.admin.getProject.path, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const projectId = Number(req.params.id);
      // Unlike storage.getProject (used by every user-facing route),
      // this has no ownership check at all — deliberately, since the
      // whole point is viewing a project that belongs to someone else.
      // Access control is the isAdmin middleware above, not a userId
      // match.
      const project = await storage.getProjectWithLines(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const totalLength = project.fenceLines.reduce((acc, line) => acc + (line.length || 0), 0);
      const estimate = totalLength === 0
        ? { options: [] }
        : await calculateEstimate(
            project.fenceLines.map((line) => ({ length: line.length || 0, material: line.material, height: line.height })),
            project.fenceLines.flatMap((line) => (line.gates || []).map((g) => ({ type: g.type }))),
          );

      logEvent("admin_viewed_project", { userId: adminId, targetUserId: project.property.userId ?? undefined, projectId });
      res.json({ project, estimate });
    } catch (err) {
      console.error('Failed to get project for admin', err);
      res.status(500).json({ message: 'Failed to get project' });
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
