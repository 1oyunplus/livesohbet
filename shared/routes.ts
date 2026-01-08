import { z } from 'zod';

export const api = {
  // We keep this minimal as we are using Firebase mostly
  // But we might want some server-side verification endpoints later
  status: {
    method: 'GET' as const,
    path: '/api/status',
    responses: {
      200: z.object({ status: z.string() }),
    },
  },
};
