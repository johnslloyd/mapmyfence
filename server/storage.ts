import { 
  projects, fenceLines, coordinates,
  type InsertProject, 
  type FenceLine, type InsertFenceLine, 
  type InsertCoordinate,
  type ProjectWithLines
} from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export interface IStorage {
  getProjects(userId: string): Promise<ProjectWithLines[]>;
  getProject(id: number, userId?: string): Promise<ProjectWithLines | undefined>;
  createProject(project: InsertProject): Promise<ProjectWithLines>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<ProjectWithLines>;
  deleteProject(id: number): Promise<void>;
  
  createFenceLine(projectId: number, fenceLine: InsertFenceLine, coords: Omit<InsertCoordinate, "fenceLineId">[]): Promise<FenceLine & { coordinates: Coordinate[] }>;
  deleteFenceLine(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private db: NodePgDatabase<typeof schema>;

  constructor(db: NodePgDatabase<typeof schema>) {
    this.db = db;
    console.log("[Storage] Initialized with DB:", !!db);
  }

  async getProjects(userId: string): Promise<ProjectWithLines[]> {
    const allProjects = await this.db.select().from(projects).where(eq(projects.userId, userId));

    const results: ProjectWithLines[] = [];
    for (const p of allProjects) {
      const lines = await this.db.select().from(fenceLines).where(eq(fenceLines.projectId, p.id));
      const linesWithCoords = [] as any[];
      for (const l of lines) {
        const coords = await this.db.select().from(coordinates).where(eq(coordinates.fenceLineId, l.id));
        linesWithCoords.push({ ...l, coordinates: coords });
      }
      results.push({ ...p, fenceLines: linesWithCoords });
    }
    return results as ProjectWithLines[];
  }

  async getProject(id: number, userId?: string): Promise<ProjectWithLines | undefined> {
    const query = userId
      ? and(eq(projects.id, id), eq(projects.userId, userId))
      : and(eq(projects.id, id), isNull(projects.userId));

    const project = await this.db.select().from(projects).where(query).limit(1);
    if (!project || project.length === 0) return undefined;
    const p = project[0];
    const lines = await this.db.select().from(fenceLines).where(eq(fenceLines.projectId, p.id));
    const linesWithCoords = [] as any[];
    for (const l of lines) {
      const coords = await this.db.select().from(coordinates).where(eq(coordinates.fenceLineId, l.id));
      linesWithCoords.push({ ...l, coordinates: coords });
    }
    return { ...p, fenceLines: linesWithCoords } as ProjectWithLines;
  }

  async createProject(insertProject: InsertProject): Promise<ProjectWithLines> {
    const [project] = await this.db.insert(projects).values(insertProject).returning();
    return { ...project, fenceLines: [] };
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<ProjectWithLines> {
    const [updated] = await this.db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return this.getProject(updated.id, updated.userId as string) as Promise<ProjectWithLines>;
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
}
