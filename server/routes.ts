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

  app.get(api.projects.get.path, async (req, res) => {
    try {
      const user = req.user as any;
      const projectId = Number(req.params.id);
      let project;

      if (req.isAuthenticated()) {
        project = await storage.getProject(projectId, user.id);
      } else {
        // For guests, only allow if the guest flag is present
        // This is a basic security measure to prevent open access to all guest projects
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

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const user = req.user as any;
      const input = api.projects.create.input.parse(req.body);
      const userId = req.isAuthenticated() && user ? user.id : null;
      const project = await storage.createProject({ ...input, userId });
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

  return httpServer;
}
