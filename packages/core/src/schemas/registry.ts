import { z } from 'zod';

export const ComponentCategorySchema = z.enum([
  'basic',
  'layout',
  'ecommerce',
  'section',
  'custom',
]);

export const PropertyControlCategorySchema = z.enum(['content', 'style', 'layout']);

export const PropertyControlTypeSchema = z.enum([
  'text',
  'number',
  'boolean',
  'select',
  'color',
  'image',
  'url',
  'textarea',
  'icon',
]);

export const SelectOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
});

export const PropertyControlSchema = z.object({
  type: PropertyControlTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  category: PropertyControlCategorySchema.default('content'),
  options: z.array(SelectOptionSchema).optional(),
  defaultValue: z.unknown().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  placeholder: z.string().optional(),
});

export interface ComponentDefinition<TProps = Record<string, unknown>, TInput = unknown> {
  type: string;
  version: number;
  label: string;
  description: string;
  category: z.infer<typeof ComponentCategorySchema>;
  icon?: string;
  propsSchema: z.ZodType<TProps, z.ZodTypeDef, TInput>;
  defaultProps: TProps;
  controls: Record<string, z.infer<typeof PropertyControlSchema>>;
  canHaveChildren: boolean;
  allowedChildren?: string[];
  requiredFeature?: string;
}

export type PropertyControl = z.infer<typeof PropertyControlSchema>;
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;
export type PropertyControlType = z.infer<typeof PropertyControlTypeSchema>;
export type PropertyControlCategory = z.infer<typeof PropertyControlCategorySchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRegistry = Map<string, ComponentDefinition<any, any>>;
