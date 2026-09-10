import {
  properties, projects, fenceLines, coordinates, gates, users, events,
  organizations, organizationMembers,
  type InsertProperty, type PropertyWithProjects,
  type InsertProject, type ProjectWithLines,
  type FenceLine, type InsertFenceLine,
  type Coordinate, type InsertCoordinate,
  type Gate, type InsertGate,
  type Organization, type OrganizationMember,
} from "@shared/schema";
import { and, eq, isNull, desc, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Same strip-list server/auth.ts's toSafeUser uses (hashedPassword,
// resetTokenHash, resetTokenExpiresAt never leave the server) — kept
// separate rather than imported to avoid a storage.ts <-> auth.ts
// circular import; the two lists are duplicated in exactly this one
// shape, easy to keep in sync since both are short and rarely touched.
function stripSensitiveUserFields<T extends { hashedPassword: string; resetTokenHash: string | null; resetTokenExpiresAt: Date | null }>(user: T) {
  const { hashedPassword, resetTokenHash, resetTokenExpiresAt, ...safe } = user;
  return safe;
}

export interface IStorage {
  getProperties(userId: string): Promise<PropertyWithProjects[]>;
  getProperty(id: number, userId?: string): Promise<PropertyWithProjects | undefined>;
  createProperty(property: InsertProperty): Promise<PropertyWithProjects>;
  updateProperty(id: number, updates: Partial<InsertProperty>): Promise<PropertyWithProjects>;
  deleteProperty(id: number): Promise<void>;

  // Ownership for a project runs through its parent property (a project
  // has no userId of its own) — userId here is "only return this if the
  // owning property belongs to this user (or, if omitted, only if the
  // owning property has no owner — the guest case)".
  getProject(id: number, userId?: string): Promise<ProjectWithLines | undefined>;
  createProject(project: InsertProject): Promise<ProjectWithLines>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<ProjectWithLines>;
  deleteProject(id: number): Promise<void>;

  createFenceLine(projectId: number, fenceLine: InsertFenceLine, coords: Omit<InsertCoordinate, "fenceLineId">[]): Promise<FenceLine & { coordinates: Coordinate[] }>;
  deleteFenceLine(id: number): Promise<void>;
  updateFenceLine(id: number, updates: Partial<InsertFenceLine & { coordinates: Omit<InsertCoordinate, "fenceLineId">[] }>): Promise<FenceLine & { coordinates: Coordinate[] }>;

  createGate(fenceLineId: number, gate: Omit<InsertGate, "fenceLineId">): Promise<Gate>;
  deleteGate(id: number): Promise<void>;

  // Admin panel (server/adminRoutes.ts) — every caller here has already
  // passed the isAdmin check; these intentionally have no per-user
  // ownership scoping the way everything else in this file does.
  getUserById(id: string): Promise<any | undefined>;
  // Added for the business-tier admin routes (2026-09-10) — org members
  // are always looked up by email there (what an operator actually has
  // on hand for a pilot business), never a raw user id.
  getUserByEmail(email: string): Promise<any | undefined>;
  getAllUsersWithCounts(): Promise<any[]>;
  getRecentEvents(limit: number): Promise<any[]>;
  // Same fence-line/coordinate/gate detail getProject(id, userId) returns,
  // deliberately WITHOUT the ownership check — admin-only caller, gated by
  // the isAdmin route middleware instead of a userId match.
  getProjectWithLines(id: number): Promise<ProjectWithLines | undefined>;
  // Real, permanent delete — the user row AND everything they own.
  deleteUserAndData(id: string): Promise<void>;

  // Manual-approval Pro upgrade flow (2026-09-10) — see shared/schema.ts's
  // planRequestedAt comment. The REQUEST side (setting planRequestedAt,
  // notifying admins) lives directly in authRoutes.ts instead of here —
  // that file already updates users.plan with raw `db` calls rather than
  // through this interface (see its own POST /api/account/upgrade), so
  // this only covers the ADMIN side, which already runs through
  // storage via server/routes.ts's isAdmin-gated routes. approveProUpgrade
  // grants it (plan -> "pro", request cleared); dismissProRequest clears
  // the request without granting anything.
  approveProUpgrade(id: string): Promise<any>;
  dismissProRequest(id: string): Promise<any>;

  // Business tier, phase 0 (2026-09-10) — see shared/schema.ts's
  // organizations/organizationMembers comments for the full model. A
  // business is a roster (role: "admin" | "member" per membership, not
  // a single fixed owner column) that must never drop below one admin —
  // removeOrganizationMember/updateOrganizationMemberRole enforce that
  // directly (throwing LastAdminError below) rather than relying on a
  // DB constraint, the same "guard it in application code" convention
  // the gate-blocks-point-deletion rule already established.
  createOrganization(name: string, firstAdminUserId: string): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getAllOrganizationsWithCounts(): Promise<any[]>;
  getOrganizationMembers(id: number): Promise<(OrganizationMember & { email: string })[]>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  addOrganizationMember(organizationId: number, userId: string, role: "admin" | "member"): Promise<OrganizationMember>;
  removeOrganizationMember(organizationId: number, userId: string): Promise<void>;
  updateOrganizationMemberRole(organizationId: number, userId: string, role: "admin" | "member"): Promise<OrganizationMember>;
  // Whether a user currently has Pro-tier capability via ANY
  // organization membership — combined with users.plan === "pro"
  // elsewhere to decide effective access (see server/routes.ts's
  // property-limit check). A separate, raw-`db` version of this same
  // check lives in server/auth.ts (isEffectivelyPro) for
  // authRoutes.ts's own call sites, which already reach the DB
  // directly rather than through this interface — two files each
  // following their own already-established data-access convention,
  // not accidental duplication.
  isUserPro(userId: string): Promise<boolean>;
}

// Thrown by removeOrganizationMember/updateOrganizationMemberRole when
// the change would leave a business with zero admins — a business must
// always have at least one. Named and exported the same way
// ParcelServiceUnavailableError is, so a route can catch this
// specifically and return a real, honest 400 instead of a generic 500.
export class LastAdminError extends Error {}

// Thrown by addOrganizationMember when the target is already on the
// roster — the composite unique constraint (organization_members_org_
// user_unique) would catch this at the DB layer regardless, but a raw
// Postgres 23505 falling through to the generic 500 handler is exactly
// the un-friendly failure this app's error-handling convention exists
// to avoid (see ParcelServiceUnavailableError/LastAdminError). Checked
// in application code, same as the last-admin invariant above, rather
// than caught from the DB exception.
export class DuplicateMemberError extends Error {}

export class DatabaseStorage implements IStorage {
  private db: NodePgDatabase<typeof schema>;

  constructor(db: NodePgDatabase<typeof schema>) {
    this.db = db;
    console.log("[Storage] Initialized with DB:", !!db);
  }

  async getProperties(userId: string): Promise<PropertyWithProjects[]> {
    const allProperties = await this.db.select().from(properties).where(eq(properties.userId, userId));

    const results: PropertyWithProjects[] = [];
    for (const pr of allProperties) {
      const projs = await this.db.select().from(projects).where(eq(projects.propertyId, pr.id));
      results.push({ ...pr, projects: projs });
    }
    return results;
  }

  async getProperty(id: number, userId?: string): Promise<PropertyWithProjects | undefined> {
    const query = userId
      ? and(eq(properties.id, id), eq(properties.userId, userId))
      : and(eq(properties.id, id), isNull(properties.userId));

    const result = await this.db.select().from(properties).where(query).limit(1);
    if (!result || result.length === 0) return undefined;
    const pr = result[0];
    const projs = await this.db.select().from(projects).where(eq(projects.propertyId, pr.id));
    return { ...pr, projects: projs };
  }

  async createProperty(insertProperty: InsertProperty): Promise<PropertyWithProjects> {
    const [property] = await this.db.insert(properties).values(insertProperty).returning();
    return { ...property, projects: [] };
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<PropertyWithProjects> {
    const [updated] = await this.db.update(properties).set(updates).where(eq(properties.id, id)).returning();
    return this.getProperty(updated.id, updated.userId as string) as Promise<PropertyWithProjects>;
  }

  async deleteProperty(id: number): Promise<void> {
    await this.db.delete(properties).where(eq(properties.id, id));
  }

  async getProjectWithLines(id: number): Promise<ProjectWithLines | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!result || result.length === 0) return undefined;
    const p = result[0];

    const propResult = await this.db.select().from(properties).where(eq(properties.id, p.propertyId)).limit(1);
    if (!propResult || propResult.length === 0) return undefined;

    const lines = await this.db.select().from(fenceLines).where(eq(fenceLines.projectId, p.id));
    const linesWithCoords = [] as any[];
    for (const l of lines) {
      const coords = await this.db.select().from(coordinates).where(eq(coordinates.fenceLineId, l.id));
      const lineGates = await this.db.select().from(gates).where(eq(gates.fenceLineId, l.id));
      linesWithCoords.push({ ...l, coordinates: coords, gates: lineGates });
    }
    return { ...p, property: propResult[0], fenceLines: linesWithCoords };
  }

  async getProject(id: number, userId?: string): Promise<ProjectWithLines | undefined> {
    const projectWithLines = await this.getProjectWithLines(id);
    if (!projectWithLines) return undefined;

    // Ownership check runs through the parent property, same guest-vs-
    // owned semantics as before: userId given -> must match the
    // property's owner; userId omitted -> only guest (unowned) properties.
    const ownerMatches = userId
      ? projectWithLines.property.userId === userId
      : projectWithLines.property.userId === null;
    if (!ownerMatches) return undefined;

    return projectWithLines;
  }

  async createProject(insertProject: InsertProject): Promise<ProjectWithLines> {
    const [project] = await this.db.insert(projects).values(insertProject).returning();
    const withLines = await this.getProjectWithLines(project.id);
    return withLines!;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<ProjectWithLines> {
    await this.db.update(projects).set(updates).where(eq(projects.id, id));
    const withLines = await this.getProjectWithLines(id);
    return withLines!;
  }

  async deleteProject(id: number): Promise<void> {
    await this.db.delete(projects).where(eq(projects.id, id));
  }

  async createFenceLine(projectId: number, fenceLine: InsertFenceLine, coords: Omit<InsertCoordinate, "fenceLineId">[]): Promise<FenceLine & { coordinates: Coordinate[] }> {
    const [newLine] = await this.db.insert(fenceLines).values({ ...fenceLine, projectId }).returning();

    if (coords.length > 0) {
      await this.db.insert(coordinates).values(
        coords.map(c => ({ ...c, fenceLineId: newLine.id }))
      );
    }

    const lineWithCoords = await this.db.select().from(fenceLines).where(eq(fenceLines.id, newLine.id)).limit(1);
    const l = lineWithCoords[0];
    const fetchedCoords = await this.db.select().from(coordinates).where(eq(coordinates.fenceLineId, l.id));
    // A brand-new line has no gates yet — but the field still needs to be
    // present so the shape matches ProjectWithLines.fenceLines everywhere.
    return { ...l, coordinates: fetchedCoords, gates: [] } as FenceLine & { coordinates: Coordinate[]; gates: Gate[] };
  }

  async deleteFenceLine(id: number): Promise<void> {
    await this.db.delete(fenceLines).where(eq(fenceLines.id, id));
  }

  async updateFenceLine(id: number, updates: Partial<InsertFenceLine & { coordinates: Omit<InsertCoordinate, "fenceLineId">[] }>): Promise<FenceLine & { coordinates: Coordinate[] }> {
    const { coordinates: coords, ...fenceLineUpdates } = updates;

    if (Object.keys(fenceLineUpdates).length > 0) {
      await this.db.update(fenceLines).set(fenceLineUpdates).where(eq(fenceLines.id, id));
    }

    if (coords) {
      await this.db.delete(coordinates).where(eq(coordinates.fenceLineId, id));
      if (coords.length > 0) {
        await this.db.insert(coordinates).values(
          coords.map(c => ({ ...c, fenceLineId: id }))
        );
      }
    }

    const lineWithCoords = await this.db.select().from(fenceLines).where(eq(fenceLines.id, id)).limit(1);
    const l = lineWithCoords[0];
    const fetchedCoords = await this.db.select().from(coordinates).where(eq(coordinates.fenceLineId, l.id));
    const fetchedGates = await this.db.select().from(gates).where(eq(gates.fenceLineId, l.id));
    return { ...l, coordinates: fetchedCoords, gates: fetchedGates } as FenceLine & { coordinates: Coordinate[]; gates: Gate[] };
  }

  async createGate(fenceLineId: number, gate: Omit<InsertGate, "fenceLineId">): Promise<Gate> {
    const [newGate] = await this.db.insert(gates).values({ ...gate, fenceLineId }).returning();
    return newGate;
  }

  async deleteGate(id: number): Promise<void> {
    await this.db.delete(gates).where(eq(gates.id, id));
  }

  async getUserById(id: string): Promise<any | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!result || result.length === 0) return undefined;
    return stripSensitiveUserFields(result[0]);
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!result || result.length === 0) return undefined;
    return stripSensitiveUserFields(result[0]);
  }

  // Real, permanent delete, not a soft/deactivate flag — matches how
  // the existing self-serve "Delete Account" flow (Account.tsx) is
  // worded and scoped, just automated here instead of "email us."
  // properties -> projects -> fenceLines -> coordinates/gates, and
  // yardBoundaries -> yardBoundaryPoints, all already CASCADE from
  // properties.id at the DB level (see shared/schema.ts) — but
  // properties.userId has NO cascade back to users.id (an orphaned
  // property was never meant to silently vanish on its own), so this
  // user's properties are deleted explicitly first, in the same
  // transaction, before the user row itself — otherwise the user
  // delete would fail on that foreign key the moment they own even one
  // property. events rows mentioning this user (userId/targetUserId)
  // are plain text columns with no FK constraint — left alone
  // afterward, same as any historical event already referencing a
  // since-deleted property/project.
  async deleteUserAndData(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(properties).where(eq(properties.userId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async approveProUpgrade(id: string): Promise<any> {
    const [updated] = await this.db
      .update(users)
      .set({ plan: "pro", planRequestedAt: null })
      .where(eq(users.id, id))
      .returning();
    return stripSensitiveUserFields(updated);
  }

  async dismissProRequest(id: string): Promise<any> {
    const [updated] = await this.db
      .update(users)
      .set({ planRequestedAt: null })
      .where(eq(users.id, id))
      .returning();
    return stripSensitiveUserFields(updated);
  }

  // A business's first admin is created in the SAME transaction as the
  // business itself — an organization can never legitimately exist with
  // zero members even for an instant, matching the "always at least one
  // admin" invariant the whole business tier is built around.
  async createOrganization(name: string, firstAdminUserId: string): Promise<Organization> {
    return await this.db.transaction(async (tx) => {
      const [org] = await tx.insert(organizations).values({ name }).returning();
      await tx.insert(organizationMembers).values({
        organizationId: org.id,
        userId: firstAdminUserId,
        role: "admin",
      });
      return org;
    });
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await this.db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return org;
  }

  async getOrganizationMembers(id: number): Promise<(OrganizationMember & { email: string })[]> {
    return await this.db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
        email: users.email,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, id));
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return await this.db
      .select({ id: organizations.id, name: organizations.name, createdAt: organizations.createdAt })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId));
  }

  async addOrganizationMember(organizationId: number, userId: string, role: "admin" | "member"): Promise<OrganizationMember> {
    const [existing] = await this.db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId)))
      .limit(1);
    if (existing) {
      throw new DuplicateMemberError("This person is already on the business's roster.");
    }
    const [member] = await this.db
      .insert(organizationMembers)
      .values({ organizationId, userId, role })
      .returning();
    return member;
  }

  // Refuses to remove the business's last remaining admin — see
  // LastAdminError's own comment above. A no-op (not an error) if the
  // target already isn't a member, matching the idempotent-delete
  // spirit of deleteFenceLine/deleteGate elsewhere in this file.
  async removeOrganizationMember(organizationId: number, userId: string): Promise<void> {
    const [target] = await this.db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId)))
      .limit(1);
    if (!target) return;
    if (target.role === "admin") {
      const admins = await this.db
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.role, "admin")));
      if (admins.length <= 1) {
        throw new LastAdminError("A business must have at least one admin — promote someone else first.");
      }
    }
    await this.db
      .delete(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId)));
  }

  // Same "would this leave zero admins" guard as removal — demoting the
  // last admin to a plain member is exactly as forbidden as removing
  // them outright.
  async updateOrganizationMemberRole(organizationId: number, userId: string, role: "admin" | "member"): Promise<OrganizationMember> {
    if (role === "member") {
      const [target] = await this.db
        .select()
        .from(organizationMembers)
        .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId)))
        .limit(1);
      if (target?.role === "admin") {
        const admins = await this.db
          .select({ id: organizationMembers.id })
          .from(organizationMembers)
          .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.role, "admin")));
        if (admins.length <= 1) {
          throw new LastAdminError("A business must have at least one admin — promote someone else first.");
        }
      }
    }
    const [updated] = await this.db
      .update(organizationMembers)
      .set({ role })
      .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId)))
      .returning();
    return updated;
  }

  // See the interface comment above for why this exists alongside
  // server/auth.ts's isEffectivelyPro rather than being the one shared
  // implementation.
  async isUserPro(userId: string): Promise<boolean> {
    const [user] = await this.db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
    if (user?.plan === "pro") return true;
    const [membership] = await this.db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);
    return !!membership;
  }

  // For the admin org list — same "flat queries, count in JS" shape as
  // getAllUsersWithCounts below, fine at this app's actual scale.
  async getAllOrganizationsWithCounts(): Promise<any[]> {
    const allOrgs = await this.db.select().from(organizations);
    const allMembers = await this.db.select().from(organizationMembers);
    const countByOrg = new Map<number, number>();
    for (const m of allMembers) {
      countByOrg.set(m.organizationId, (countByOrg.get(m.organizationId) ?? 0) + 1);
    }
    return allOrgs
      .map((org) => ({ ...org, memberCount: countByOrg.get(org.id) ?? 0 }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Three flat queries instead of one per user (or a SQL-level join) —
  // simple and fast enough at this app's actual scale (a few dozen
  // accounts today); revisit with a real aggregate query if the admin
  // panel ever needs to scale past that.
  async getAllUsersWithCounts(): Promise<any[]> {
    const allUsers = await this.db.select().from(users);
    const allProperties = await this.db.select().from(properties);
    const allProjects = await this.db.select().from(projects);

    const propertyIdsByUser = new Map<string, number[]>();
    for (const p of allProperties) {
      if (!p.userId) continue;
      const arr = propertyIdsByUser.get(p.userId) ?? [];
      arr.push(p.id);
      propertyIdsByUser.set(p.userId, arr);
    }
    const projectCountByProperty = new Map<number, number>();
    for (const pr of allProjects) {
      projectCountByProperty.set(pr.propertyId, (projectCountByProperty.get(pr.propertyId) ?? 0) + 1);
    }

    return allUsers
      .map((u) => {
        const propertyIds = propertyIdsByUser.get(u.id) ?? [];
        const projectCount = propertyIds.reduce((sum, pid) => sum + (projectCountByProperty.get(pid) ?? 0), 0);
        return { ...stripSensitiveUserFields(u), propertyCount: propertyIds.length, projectCount };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecentEvents(limit: number): Promise<any[]> {
    const recentEvents = await this.db.select().from(events).orderBy(desc(events.createdAt)).limit(limit);
    const userIds = new Set<string>();
    for (const e of recentEvents) {
      if (e.userId) userIds.add(e.userId);
      if (e.targetUserId) userIds.add(e.targetUserId);
    }
    const relevantUsers = userIds.size > 0
      ? await this.db.select().from(users).where(inArray(users.id, Array.from(userIds)))
      : [];
    const emailById = new Map(relevantUsers.map((u) => [u.id, u.email]));

    return recentEvents.map((e) => ({
      ...e,
      userEmail: e.userId ? emailById.get(e.userId) ?? null : null,
      targetUserEmail: e.targetUserId ? emailById.get(e.targetUserId) ?? null : null,
    }));
  }
}
