import { z } from 'zod';
import { SectionNodeSchema } from './node';
import { ThemeTokensSchema } from './theme';

export const CURRENT_SCHEMA_VERSION = 1;

export const PageMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').default('Untitled Page'),
  description: z.string().optional().default(''),
  slug: z.string().optional().default('/'),
  author: z.string().optional(),
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  createdAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().optional().default(() => new Date().toISOString()),
});

export const PageDocumentSchema = z.object({
  id: z.string().min(1, 'Document ID cannot be empty'),
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  metadata: PageMetadataSchema.default({}),
  theme: ThemeTokensSchema.default({}),
  sections: z.array(SectionNodeSchema).default([]),
});

export type PageMetadata = z.infer<typeof PageMetadataSchema>;
export type PageDocument = z.infer<typeof PageDocumentSchema>;
