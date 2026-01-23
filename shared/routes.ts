import { z } from 'zod';
import { insertProjectSchema, insertFenceLineSchema } from './schema';

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
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      responses: {
        200: z.array(z.any()), // ProjectWithLines would be better but keeping it simple for contract
      },
    },
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
      path: '/api/projects',
      // omit userId from the client payload; server sets it from the session
      input: insertProjectSchema.omit({ userId: true }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/projects/:id',
      input: insertProjectSchema.partial(),
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
