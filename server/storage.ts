import {
  properties, projects, fenceLines, coordinates,
  type InsertProperty, type PropertyWithProjects,
  type InsertProject, type ProjectWithLines,
  type FenceLine, type InsertFenceLine,
  type Coordinate, type InsertCoordinate,
} from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

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
      linesWithCoords.push({ ...l, coordinates: coords });
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
    return { ...l, coordinates: fetchedCoords } as FenceLine & { coordinates: Coordinate[] };
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
    return { ...l, coordinates: fetchedCoords } as FenceLine & { coordinates: Coordinate[] };
  }
}
