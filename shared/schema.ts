import { pgTable, text, serial, doublePrecision, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  description: text("description"),
  status: text("status", { enum: ["planning", "quoting", "in-progress", "completed"] }).default("planning").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id").references(() => users.id),
});

export const fenceLines = pgTable("fence_lines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  material: text("material"), // e.g., Cedar, Vinyl, Chain Link
  height: doublePrecision("height"), // in feet
  length: doublePrecision("length"), // in feet
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coordinates = pgTable("coordinates", {
  id: serial("id").primaryKey(),
  fenceLineId: integer("fence_line_id").references(() => fenceLines.id, { onDelete: 'cascade' }).notNull(),
  order: integer("order").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "6 ft. Cedar Fence Panel"
  type: text("type", { enum: ["panel", "post", "concrete", "gate", "picket", "rail"] }).notNull(),
  store: text("store", { enum: ["lowes", "home_depot"] }).notNull(),
  price: doublePrecision("price").notNull(), // price per unit
  unit: text("unit"), // e.g., "per panel", "per bag"
  url: text("url"), // URL to the product page
  sku: text("sku"), // Store's SKU
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  fenceLines: many(fenceLines),
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const fenceLinesRelations = relations(fenceLines, ({ one, many }) => ({
  project: one(projects, {
    fields: [fenceLines.projectId],
    references: [projects.id],
  }),
  coordinates: many(coordinates),
}));

export const coordinatesRelations = relations(coordinates, ({ one }) => ({
  fenceLine: one(fenceLines, {
    fields: [coordinates.fenceLineId],
    references: [fenceLines.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertFenceLineSchema = createInsertSchema(fenceLines).omit({ id: true, createdAt: true });
export const insertCoordinateSchema = createInsertSchema(coordinates).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type FenceLine = typeof fenceLines.$inferSelect;
export type InsertFenceLine = z.infer<typeof insertFenceLineSchema>;
export type Coordinate = typeof coordinates.$inferSelect;
export type InsertCoordinate = z.infer<typeof insertCoordinateSchema>;
export type Product = typeof products.$inferSelect;

// Detailed types for frontend
export type ProjectWithLines = Project & {
  fenceLines: (FenceLine & { coordinates: Coordinate[] })[];
};

export type CreateProjectRequest = InsertProject;
export type UpdateProjectRequest = Partial<InsertProject>;

export type AddFenceLineRequest = InsertFenceLine & {
  coordinates: Omit<InsertCoordinate, "fenceLineId">[];
};

export type FenceStatsResponse = {
  totalLength: number; // calculated in meters/feet
  estimatedCost: number;
  materialBreakdown: Record<string, number>;
};
