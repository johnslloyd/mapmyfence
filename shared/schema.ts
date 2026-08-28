import { pgTable, text, serial, doublePrecision, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  // Password reset — set together, cleared together. Store a SHA-256
  // HASH of the reset token here, never the raw token (same reasoning as
  // hashing the password itself: a DB leak shouldn't hand out usable
  // credentials). The raw token only ever exists in the emailed link and
  // the incoming request that redeems it.
  resetTokenHash: text("reset_token_hash"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
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

// Minimal local usage funnel logging — no external analytics service.
// Deliberately NOT foreign-keyed to projects/users: this is an append-only
// log, and a hard FK would block deleting a project/user that has history.
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type", {
    enum: ["project_created", "fence_line_created", "estimate_viewed", "account_created"],
  }).notNull(),
  projectId: integer("project_id"),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "6 ft. Cedar Fence Panel"
  type: text("type", { enum: ["panel", "post", "concrete", "gate", "picket", "rail", "fasteners"] }).notNull(),
  store: text("store", { enum: ["lowes", "home_depot"] }).notNull(),
  price: doublePrecision("price").notNull(), // price per unit
  unit: text("unit"), // e.g., "per panel", "per bag"
  url: text("url"), // URL to the product page
  sku: text("sku"), // Store's SKU
  // Meaningful for "post", "rail", and "picket" — which wood species this
  // listing is. Full species consistency: a "Wood: Cedar" fence line uses
  // cedar posts and rails too, not just cedar pickets (a deliberate
  // decision — the more common real-world default is PT pine framing
  // regardless of picket species, but this app intentionally goes
  // further). concrete/fasteners/gate stay untagged/null — genuinely no
  // species variant exists for hardware/consumables.
  material: text("material", { enum: ["pine", "cedar"] }),
  // Meaningful for "post" and "picket" — which fence height (ft) this
  // listing is sized for. A post long enough to be buried for a 6-ft
  // fence isn't long enough for an 8-ft fence, and 8-ft pickets are a
  // different (longer, often thicker-profile) product than 6-ft ones.
  // "rail" is NOT height-tagged — the horizontal board itself is the
  // same 8-ft length regardless of fence height; only the QUANTITY per
  // section changes for taller fences (see RAILS_PER_SECTION in
  // server/estimates.ts). concrete/fasteners/gate stay untagged/null.
  forHeight: integer("for_height"),
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
