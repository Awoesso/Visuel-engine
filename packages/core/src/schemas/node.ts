import { z } from 'zod/v3';
import { ResponsiveStylesSchema, type ResponsiveStyles } from './styles';

const BaseComponentNodeSchema = z.object({
  id: z.string().min(1, 'Node ID cannot be empty'),
  type: z.string().min(1, 'Component type cannot be empty'),
  version: z.number().int().positive().default(1),
  name: z.string().optional(),
  props: z.record(z.unknown()).default({}),
  styles: ResponsiveStylesSchema.default({ desktop: {} }),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

export type ComponentNode = {
  id: string;
  type: string;
  version: number;
  name?: string;
  props: Record<string, unknown>;
  styles: ResponsiveStyles;
  children: ComponentNode[];
  locked: boolean;
  hidden: boolean;
};

export const ComponentNodeSchema: z.ZodType<
  ComponentNode,
  z.ZodTypeDef,
  {
    id: string;
    type: string;
    version?: number;
    name?: string;
    props?: Record<string, unknown>;
    styles?: z.input<typeof ResponsiveStylesSchema>;
    children?: unknown[];
    locked?: boolean;
    hidden?: boolean;
  }
> = BaseComponentNodeSchema.extend({
  children: z.lazy(() => z.array(ComponentNodeSchema)).default([]),
});

// Input type for raw data before validation – mirrors the Zod input shape.
export type ComponentNodeInput = z.input<typeof ComponentNodeSchema>;

export const SectionNodeSchema = z.object({
  id: z.string().min(1, 'Section ID cannot be empty'),
  type: z.string().default('section'),
  name: z.string().default('Section'),
  styles: ResponsiveStylesSchema.default({ desktop: {} }),
  children: z.array(ComponentNodeSchema).default([]),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

export type SectionNode = z.infer<typeof SectionNodeSchema>;
