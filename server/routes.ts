import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
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

  app.put(api.projects.update.path, async (req, res) => {
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

  app.delete(api.projects.delete.path, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.fenceLines.create.path, async (req, res) => {
    try {
      const { coordinates, ...lineData } = api.fenceLines.create.input.parse(req.body);
      const line = await storage.createFenceLine(Number(req.params.projectId), lineData, coordinates);
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

  app.delete(api.fenceLines.delete.path, async (req, res) => {
    await storage.deleteFenceLine(Number(req.params.id));
    res.status(204).end();
  });

  // Seed data
  const existing = await storage.getProjects();
  if (existing.length === 0) {
    const p1 = await storage.createProject({
      name: "Sample Backyard Fence",
      address: "123 Map St, Fencetown",
      description: "Proposed cedar fence for the backyard perimeter.",
      status: "planning"
    });
    
    await storage.createFenceLine(p1.id, {
      name: "North Boundary",
      material: "Cedar",
      height: 6,
      color: "Natural",
      projectId: p1.id
    }, [
      { lat: 45.523062, lng: -122.676482, order: 0 },
      { lat: 45.523162, lng: -122.676482, order: 1 }
    ]);
  }

  return httpServer;
}
