import { z } from 'zod';
import { insertPropertySchema, insertProjectSchema, insertFenceLineSchema } from './schema';

// A gate's position on its fence line: which segment (the straight run
// between two consecutive drawn points) it sits on, and how far along
// that segment (0 = at the first point, 1 = at the second). Set once,
// from wherever the user clicked on the line — see MapEditorComponent.
const gatePositionSchema = z.object({
  type: z.enum(['single', 'double']),
  segmentIndex: z.number().int().min(0),
  position: z.number().min(0).max(1),
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Free accounts are capped at this many properties; Pro is unlimited.
// Shared so client and server (server/routes.ts's enforcement,
// Account.tsx's/AddPropertyDialog's copy) can't drift out of sync with
// each other the way the same number used to be hand-duplicated in both
// places. See CLAUDE.md's "Account tiers" section.
export const FREE_PROPERTY_LIMIT = 3;

export const api = {
  // No billing exists yet — self-serve, free during beta. See
  // CLAUDE.md's "Account tiers" section and FREE_PROPERTY_LIMIT above
  // for how `plan` actually gates property creation.
  account: {
    upgrade: {
      method: 'POST' as const,
      path: '/api/account/upgrade',
      responses: {
        200: z.object({ plan: z.enum(['free', 'pro']) }),
      },
    },
  },
  // Read-only, server-side gated on users.isAdmin (never just hidden
  // client-side — see server/adminRoutes.ts). Response shapes kept loose
  // (z.any()) the same way api.properties/api.projects already do for
  // nested detail — see the API convention note on that pattern. Every
  // GET here logs its own audit event (admin_viewed_users/
  // admin_viewed_user) — see CLAUDE.md's "Admin panel" section.
  admin: {
    listUsers: {
      method: 'GET' as const,
      path: '/api/admin/users',
      responses: {
        200: z.array(z.any()),
        403: errorSchemas.notFound,
      },
    },
    getUser: {
      method: 'GET' as const,
      path: '/api/admin/users/:id',
      responses: {
        200: z.any(),
        403: errorSchemas.notFound,
        404: errorSchemas.notFound,
      },
    },
    listEvents: {
      method: 'GET' as const,
      path: '/api/admin/events',
      responses: {
        200: z.array(z.any()),
        403: errorSchemas.notFound,
      },
    },
    // A specific project's real fence-line detail (coordinates, gates)
    // plus its computed materials estimate — same data shape a user's
    // own editor sidebar shows, fetched cross-user via storage's
    // unrestricted getProjectWithLines rather than the ownership-gated
    // storage.getProject a real user's /api/projects/:id/estimates uses.
    getProject: {
      method: 'GET' as const,
      path: '/api/admin/projects/:id',
      responses: {
        200: z.any(),
        403: errorSchemas.notFound,
        404: errorSchemas.notFound,
      },
    },
  },
  // A property is just an address — name/address/description, no type,
  // no status. See CLAUDE.md's "Property / Project restructure" section.
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties',
      responses: {
        200: z.array(z.any()), // PropertyWithProjects would be better but keeping it simple for contract
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties',
      // omit userId from the client payload; server sets it from the session
      input: insertPropertySchema.omit({ userId: true }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/properties/:id',
      input: insertPropertySchema.partial(),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/properties/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  // A project is a typed, named, statused unit of work under a property
  // — "Backyard Privacy Fence" (type: fence). This is what the fence
  // editor is actually keyed on.
  projects: {
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties/:propertyId/projects',
      // omit propertyId from the client payload; comes from the URL param
      input: insertProjectSchema.omit({ propertyId: true }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/projects/:id',
      input: insertProjectSchema.omit({ propertyId: true }).partial(),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    getEstimates: {
      method: 'GET' as const,
      path: '/api/projects/:id/estimates',
      responses: {
        // Homeowners shop at one store, not a mix — so this is one
        // complete, independently-priced option PER STORE (each store's
        // own cheapest post/rail/picket/concrete), not a single list
        // cherry-picking the cheapest item across stores. A store is only
        // included if it has pricing for every required material type.
        // Sorted cheapest-total-first by the server.
        200: z.object({
          options: z.array(z.object({
            store: z.string(),
            materials: z.array(z.object({
              id: z.number(),
              name: z.string(),
              type: z.string(),
              store: z.string(),
              price: z.number(),
              unit: z.string().nullable(),
              url: z.string().nullable(),
              sku: z.string().nullable(),
              quantity: z.number(),
              totalCost: z.number(),
            })),
            totalCost: z.number(),
          })),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  parcels: {
    lookup: {
      method: 'GET' as const,
      path: '/api/parcels/lookup',
      responses: {
        200: z.discriminatedUnion('found', [
          z.object({
            found: z.literal(true),
            source: z.literal('mississippi'),
            parcelId: z.string(),
            ownerName: z.string().nullable(),
            siteAddress: z.string().nullable(),
            geometry: z.any(), // GeoJSON Polygon | MultiPolygon
          }),
          z.object({ found: z.literal(false) }),
        ]),
        400: errorSchemas.validation,
      },
    },
  },
  fenceLines: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/fence-lines',
      input: z.object({
        name: z.string(),
        material: z.string().optional(),
        height: z.number().optional(),
        length: z.number().optional(),
        color: z.string().optional(),
        coordinates: z.array(z.object({
          lat: z.number(),
          lng: z.number(),
          order: z.number()
        }))
      }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fence-lines/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fence-lines/:id',
      input: z.object({
        name: z.string().optional(),
        material: z.string().optional(),
        height: z.number().optional(),
        length: z.number().optional(),
        color: z.string().optional(),
        coordinates: z.array(z.object({
          id: z.number().optional(),
          lat: z.number(),
          lng: z.number(),
          order: z.number()
        })).optional()
      }),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  // A gate sits on a specific fence line — not user-drawn, just a
  // single/double choice snapped to a click on the already-drawn line.
  // See shared/schema.ts's `gates` table comment and
  // MapEditorComponent's gate-placement mode for the interaction.
  gates: {
    create: {
      method: 'POST' as const,
      path: '/api/fence-lines/:fenceLineId/gates',
      input: gatePositionSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/gates/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
