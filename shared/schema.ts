import { pgTable, text, serial, doublePrecision, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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
  // Free accounts are capped at FREE_PROPERTY_LIMIT properties (see
  // server/routes.ts); Pro is unlimited. No billing exists yet — Pro is
  // self-serve and free during beta (Account page's "Upgrade" button,
  // POST /api/account/upgrade), a deliberate, explicit choice over a
  // manual-grant-only flow: it's low-friction AND doubles as a real
  // signal of who wants more, before any billing work is ever built.
  plan: text("plan", { enum: ["free", "pro"] }).default("free").notNull(),
  // Gates /admin and the api.admin.* routes — checked server-side on
  // every admin route (server/adminRoutes.ts), never just hidden client-
  // side. False for everyone by default; there's no self-serve way to
  // become an admin (that would defeat the point) — granted by hand
  // against the DB, same spirit as the account-deletion flow being
  // deliberately not self-serve yet.
  isAdmin: boolean("is_admin").default(false).notNull(),
  // Added retroactively (2026-08-30, alongside the admin panel) —
  // existing rows backfill to the migration's run time, NOT their real
  // signup date, since that was never captured before now. Real for
  // every account created from this point forward.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// A property is just an address — no type, no status. One user can have
// many properties (multiple yards). Renamed from the original "projects"
// table (2026-08-28 restructure, see CLAUDE.md's "Property / Project
// restructure" section) once it became clear "project" was being asked
// to carry two different meanings: the physical yard (never changes,
// has an address) and a typed unit of work on that yard (has a status,
// a lifecycle, and — with the lawn-care vertical coming — a type).
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id").references(() => users.id),
});

// A project is a typed, named, statused unit of work under a property —
// "Backyard Privacy Fence" (type: fence), "Spring Pre-Emergent Plan"
// (type: lawn_care). This is the NEW entity that used to be conflated
// with the property itself. `status` moved here from the old top-level
// table — it always described work-in-progress, never the property.
// Every existing property got exactly one type="fence" project created
// for it during the restructure migration, so today's single-fence-plan
// UX is unchanged; multiple projects per property (a second fence
// project, or eventually a lawn-care project) is what this unlocks.
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  type: text("type", { enum: ["fence", "lawn_care"] }).notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ["planning", "quoting", "in-progress", "completed"] }).default("planning").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// A gate placed on a fence line. Deliberately NOT user-drawn — the user
// picks "single" or "double" and clicks a spot on the already-drawn
// line; the gate snaps to that click's position on whichever segment it
// landed on. Storing (segmentIndex, position) rather than a raw lat/lng
// is what makes that survive later edits: MapEditorComponent already
// lets a fence line's points be dragged after the fact, and a
// segment-relative position is re-derived by interpolating between
// coordinates[segmentIndex] and coordinates[segmentIndex+1] at render
// time, so the gate stays put relative to the line even if an endpoint
// moves — the same "derive, don't duplicate" spirit as recomputing
// length from coordinates instead of trusting a stored value.
export const gates = pgTable("gates", {
  id: serial("id").primaryKey(),
  fenceLineId: integer("fence_line_id").references(() => fenceLines.id, { onDelete: 'cascade' }).notNull(),
  type: text("type", { enum: ["single", "double"] }).notNull(),
  // The gate sits on the segment between coordinates[segmentIndex] and
  // coordinates[segmentIndex+1] (coordinates ordered by `order`).
  segmentIndex: integer("segment_index").notNull(),
  // 0..1 fraction along that segment where the gate is centered —
  // wherever the user actually clicked, projected onto the segment.
  position: doublePrecision("position").notNull().default(0.5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Yard-care vertical groundwork — schema only, nothing else built yet.
// A yard boundary is the enclosed polygon for a property, distinct from
// fenceLines (open polylines with a length): fertilizer/pre-emergent/
// herbicide coverage is sold per square foot, the same way fence
// materials are sold per linear foot, so a future lawn-care estimate
// engine needs an area, not a length. Belongs to the PROPERTY, not a
// project — the physical boundary doesn't change between (say) a Spring
// and a Fall lawn-care project on the same yard, so it's measured once
// per property and reused, not duplicated per project. One boundary per
// property — enforced via .unique() on propertyId. No drawing UI, no
// area-based product recommendations, and no timing/scheduling logic
// exist yet — see "Lawn-care vertical — architecture groundwork only" in
// CLAUDE.md for what this is (and isn't) meant to unblock.
export const yardBoundaries = pgTable("yard_boundaries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'cascade' }).notNull().unique(),
  areaSqFt: doublePrecision("area_sq_ft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const yardBoundaryPoints = pgTable("yard_boundary_points", {
  id: serial("id").primaryKey(),
  yardBoundaryId: integer("yard_boundary_id").references(() => yardBoundaries.id, { onDelete: 'cascade' }).notNull(),
  order: integer("order").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

// Minimal local usage funnel logging — no external analytics service.
// Deliberately NOT foreign-keyed to properties/projects/users: this is an
// append-only log, and a hard FK would block deleting a property/project/
// user that has history.
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  // "property_created" added alongside the Property/Project restructure —
  // fires on the top-level "Add a Property" action (which also creates
  // that property's first project, so a property_created event is always
  // paired with a project_created one today). "project_created" now means
  // a typed project specifically, not the old top-level entity.
  // "admin_viewed_users"/"admin_viewed_user" (2026-08-30) are the admin
  // panel's own audit trail — see targetUserId below and
  // server/adminRoutes.ts. Deliberately logged the same way every other
  // funnel event is, not a separate audit system, so "who looked at
  // what, and when" lives in one place.
  type: text("type", {
    enum: ["property_created", "project_created", "fence_line_created", "estimate_viewed", "account_created", "account_upgraded", "admin_viewed_users", "admin_viewed_user"],
  }).notNull(),
  propertyId: integer("property_id"),
  projectId: integer("project_id"),
  // For every event type EXCEPT the admin_* ones, this is who the event
  // is ABOUT (the new account, the property's owner, etc.). For
  // admin_viewed_users/admin_viewed_user, this is the ADMIN who took the
  // action instead — targetUserId (admin_viewed_user only) is who they
  // looked at. Reusing `userId` for "the admin" rather than adding a
  // third id column keeps every other event type's meaning unchanged.
  userId: text("user_id"),
  targetUserId: text("target_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "6 ft. Cedar Fence Panel"
  // "fertilizer"/"pre_emergent"/"herbicide"/"pesticide" are lawn-care
  // groundwork — placeholder types only, nothing seeds or queries them
  // yet (no lawn-care estimate engine exists). Added now because this
  // is a TypeScript-only enum (Drizzle's `enum` option, not a native
  // Postgres constraint — see "Database migrations" below), so there's
  // zero migration cost to reserving the values ahead of the feature.
  type: text("type", { enum: ["panel", "post", "concrete", "gate", "picket", "rail", "fasteners", "fertilizer", "pre_emergent", "herbicide", "pesticide"] }).notNull(),
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
  // Meaningful only for type="gate" — which role this hardware plays in
  // a gate's BOM. A "single" gate needs one hardware_kit (hinges +
  // latch); a "double" gate needs two (one per leaf) PLUS one
  // cane_bolt to anchor the inactive leaf into the ground — modeled as
  // two real, separately-bought hardware products rather than one
  // fabricated "double gate kit" SKU, because no single-SKU double-gate
  // kit was found to actually exist at either retailer (see
  // server/estimates.ts). Gate hardware is species-agnostic (steel),
  // so `material`/`forHeight` stay null here the same as concrete and
  // fasteners.
  gateComponent: text("gate_component", { enum: ["hardware_kit", "cane_bolt"] }),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ many, one }) => ({
  projects: many(projects),
  yardBoundary: one(yardBoundaries, {
    fields: [properties.id],
    references: [yardBoundaries.propertyId],
  }),
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  fenceLines: many(fenceLines),
  property: one(properties, {
    fields: [projects.propertyId],
    references: [properties.id],
  }),
}));

export const fenceLinesRelations = relations(fenceLines, ({ one, many }) => ({
  project: one(projects, {
    fields: [fenceLines.projectId],
    references: [projects.id],
  }),
  coordinates: many(coordinates),
  gates: many(gates),
}));

export const gatesRelations = relations(gates, ({ one }) => ({
  fenceLine: one(fenceLines, {
    fields: [gates.fenceLineId],
    references: [fenceLines.id],
  }),
}));

export const yardBoundariesRelations = relations(yardBoundaries, ({ one, many }) => ({
  property: one(properties, {
    fields: [yardBoundaries.propertyId],
    references: [properties.id],
  }),
  points: many(yardBoundaryPoints),
}));

export const yardBoundaryPointsRelations = relations(yardBoundaryPoints, ({ one }) => ({
  yardBoundary: one(yardBoundaries, {
    fields: [yardBoundaryPoints.yardBoundaryId],
    references: [yardBoundaries.id],
  }),
}));

export const coordinatesRelations = relations(coordinates, ({ one }) => ({
  fenceLine: one(fenceLines, {
    fields: [coordinates.fenceLineId],
    references: [fenceLines.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertFenceLineSchema = createInsertSchema(fenceLines).omit({ id: true, createdAt: true });
export const insertCoordinateSchema = createInsertSchema(coordinates).omit({ id: true });
export const insertGateSchema = createInsertSchema(gates).omit({ id: true, createdAt: true });
export const insertYardBoundarySchema = createInsertSchema(yardBoundaries).omit({ id: true, createdAt: true });
export const insertYardBoundaryPointSchema = createInsertSchema(yardBoundaryPoints).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type FenceLine = typeof fenceLines.$inferSelect;
export type InsertFenceLine = z.infer<typeof insertFenceLineSchema>;
export type Coordinate = typeof coordinates.$inferSelect;
export type InsertCoordinate = z.infer<typeof insertCoordinateSchema>;
export type Gate = typeof gates.$inferSelect;
export type InsertGate = z.infer<typeof insertGateSchema>;
export type Product = typeof products.$inferSelect;
export type YardBoundary = typeof yardBoundaries.$inferSelect;
export type InsertYardBoundary = z.infer<typeof insertYardBoundarySchema>;
export type YardBoundaryPoint = typeof yardBoundaryPoints.$inferSelect;
export type InsertYardBoundaryPoint = z.infer<typeof insertYardBoundaryPointSchema>;

// Detailed types for frontend. ProjectWithLines is what the fence editor
// needs: the project's own fields (type/name/status) PLUS its parent
// property's fields (address, in particular — geocoding/the map need it)
// PLUS its fence lines. PropertyWithProjects is the lighter-weight shape
// for the property overview page — every project under a property, but
// without each one's full fenceLines/coordinates detail.
export type ProjectWithLines = Project & {
  property: Property;
  fenceLines: (FenceLine & { coordinates: Coordinate[]; gates: Gate[] })[];
};

export type PropertyWithProjects = Property & {
  projects: Project[];
};

export type CreatePropertyRequest = InsertProperty;
export type UpdatePropertyRequest = Partial<InsertProperty>;

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
