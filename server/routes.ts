import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { IStorage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Middleware to check if the user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  storage: IStorage
): Promise<Server> {
  
  app.get(api.projects.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projects = await storage.getProjects(user.id);
      res.json(projects);
    } catch (err) {
      console.error('Failed to list projects', err);
      res.status(500).json({ message: 'Failed to list projects' });
    }
  });

  app.get(api.projects.get.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const project = await storage.getProject(Number(req.params.id), user.id);
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
      const user = req.user as any;
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject({ ...input, userId: user.id }, user.id);
      res.status(201).json(project);
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

  app.put(api.projects.update.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input, user.id);
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
    const user = req.user as any;
    await storage.deleteProject(Number(req.params.id), user.id);
    res.status(204).end();
  });

  app.post(api.fenceLines.create.path, isAuthenticated, async (req, res) => {
    try {
      const { coordinates, ...rest } = api.fenceLines.create.input.parse(req.body);
      const line = await storage.createFenceLine(Number(req.params.projectId), { ...rest, projectId: Number(req.params.projectId) }, coordinates);
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

  return httpServer;
}
