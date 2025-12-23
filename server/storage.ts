import { db } from "./db";
import { 
  projects, fenceLines, coordinates,
  type Project, type InsertProject, 
  type FenceLine, type InsertFenceLine, 
  type Coordinate, type InsertCoordinate,
  type ProjectWithLines
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProjects(): Promise<ProjectWithLines[]>;
  getProject(id: number): Promise<ProjectWithLines | undefined>;
  createProject(project: InsertProject): Promise<ProjectWithLines>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<ProjectWithLines>;
  deleteProject(id: number): Promise<void>;
  
  createFenceLine(projectId: number, fenceLine: InsertFenceLine, coords: Omit<InsertCoordinate, "fenceLineId">[]): Promise<FenceLine & { coordinates: Coordinate[] }>;
  deleteFenceLine(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<ProjectWithLines[]> {
    const allProjects = await db.query.projects.findMany({
      with: {
        fenceLines: {
          with: {
            coordinates: true
          }
        }
      }
    });
    return allProjects as ProjectWithLines[];
  }

  async getProject(id: number): Promise<ProjectWithLines | undefined> {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        fenceLines: {
          with: {
            coordinates: true
          }
        }
      }
    });
    return project as ProjectWithLines | undefined;
  }

  async createProject(insertProject: InsertProject): Promise<ProjectWithLines> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return { ...project, fenceLines: [] };
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<ProjectWithLines> {
    const [updated] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return this.getProject(updated.id) as Promise<ProjectWithLines>;
  }

  async deleteProject(id: number): Promise<void> {
    // cascades should be handled by DB or manually if needed
    // For now simple delete
    await db.delete(projects).where(eq(projects.id, id));
  }

  async createFenceLine(projectId: number, fenceLine: InsertFenceLine, coords: Omit<InsertCoordinate, "fenceLineId">[]): Promise<FenceLine & { coordinates: Coordinate[] }> {
    const [newLine] = await db.insert(fenceLines).values({ ...fenceLine, projectId }).returning();
    
    if (coords.length > 0) {
      await db.insert(coordinates).values(
        coords.map(c => ({ ...c, fenceLineId: newLine.id }))
      );
    }
    
    const lineWithCoords = await db.query.fenceLines.findFirst({
      where: eq(fenceLines.id, newLine.id),
      with: {
        coordinates: true
      }
    });
    
    return lineWithCoords as FenceLine & { coordinates: Coordinate[] };
  }

  async deleteFenceLine(id: number): Promise<void> {
    await db.delete(fenceLines).where(eq(fenceLines.id, id));
  }
}

export const storage = new DatabaseStorage();
