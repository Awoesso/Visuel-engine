import { z } from 'zod/v3';
import { PageDocumentSchema } from './document';

export const TemplateCategorySchema = z.enum([
  'ecommerce',
  'portfolio',
  'landing-page',
  'blog',
  'services',
  'other',
]);

export const TemplateMetadataSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  version: z.string().min(1, 'Template version is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().default(''),
  category: TemplateCategorySchema.default('ecommerce'),
  thumbnailUrl: z.string().optional(),
  author: z.string().optional(),
  compatibleSchemaVersion: z.number().int().positive().default(1),
  requiredFeatures: z.array(z.string()).optional().default([]),
  requiredComponents: z.array(z.string()).optional().default([]),
});

export const TemplateDefinitionSchema = z.object({
  metadata: TemplateMetadataSchema,
  initialDocument: PageDocumentSchema,
});

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;
export type TemplateMetadata = z.infer<typeof TemplateMetadataSchema>;
export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;
