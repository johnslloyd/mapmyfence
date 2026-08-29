import { z } from 'zod';
import { insertPropertySchema, insertProjectSchema, insertFenceLineSchema } from './schema';

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

export const api = {
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
  }
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
