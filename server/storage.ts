import {
  properties, projects, fenceLines, coordinates, gates, users, events,
  type InsertProperty, type PropertyWithProjects,
  type InsertProject, type ProjectWithLines,
  type FenceLine, type InsertFenceLine,
  type Coordinate, type InsertCoordinate,
  type Gate, type InsertGate,
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
  getAllUsersWithCounts(): Promise<any[]>;
  getRecentEvents(limit: number): Promise<any[]>;
}

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

  private async getProjectWithLines(id: number): Promise<ProjectWithLines | undefined> {
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
