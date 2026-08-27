import { db } from "./db";
import { events } from "@shared/schema";

type EventType = typeof events.$inferInsert["type"];

/**
 * Fire-and-forget usage funnel logging, local-only (own DB table, no
 * external service or API key). Never let a logging failure break the
 * actual request — swallow and log to stderr instead.
 */
export function logEvent(
  type: EventType,
  fields: { projectId?: number; userId?: string } = {},
): void {
  db.insert(events)
    .values({ type, projectId: fields.projectId, userId: fields.userId })
    .catch((err) => {
      console.error(`[events] Failed to log '${type}':`, err);
    });
}
