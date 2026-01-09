import { 
  projects, fenceLines, coordinates,
  type Project, type InsertProject, 
  type FenceLine, type InsertFenceLine, 
  type Coordinate, type InsertCoordinate,
  type ProjectWithLines
} from "@shared/schema";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export interface IStorage {
  getProjects(userId: string): Promise<ProjectWithLines[]>;
  getProject(id: number, userId: string): Promise<ProjectWithLines | undefined>;
  createProject(project: InsertProject, userId: string): Promise<ProjectWithLines>;
  updateProject(id: number, updates: Partial<InsertProject>, userId: string): Promise<ProjectWithLines>;
  deleteProject(id: number, userId: string): Promise<void>;
  
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

  async getProject(id: number, userId: string): Promise<ProjectWithLines | undefined> {
    const project = await this.db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
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

  async createProject(insertProject: InsertProject, userId: string): Promise<ProjectWithLines> {
    const [project] = await this.db.insert(projects).values({ ...insertProject, userId }).returning();
    return { ...project, fenceLines: [] };
  }

  async updateProject(id: number, updates: Partial<InsertProject>, userId: string): Promise<ProjectWithLines> {
    const [updated] = await this.db.update(projects).set(updates).where(and(eq(projects.id, id), eq(projects.userId, userId))).returning();
    return this.getProject(updated.id, userId) as Promise<ProjectWithLines>;
  }

  async deleteProject(id: number, userId: string): Promise<void> {
    await this.db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
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
