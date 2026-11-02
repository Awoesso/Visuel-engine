import { TemplateDefinition, TemplateDefinitionSchema } from '@dsk/core';

/** In‑memory registry for templates */
export const templateRegistry = new Map<string, TemplateDefinition>();

/** Register a new template. Throws if id already exists. */
export function registerTemplate(def: TemplateDefinition): void {
  const { id } = def.metadata;
  if (templateRegistry.has(id)) {
    throw new Error(`Template with id "${id}" is already registered.`);
  }
  // Validate against core schema (throws if invalid)
  const parsed = TemplateDefinitionSchema.parse(def);
  templateRegistry.set(id, parsed);
}

/** Load a template by id, validated on the fly. */
export function loadTemplate(id: string): TemplateDefinition {
  const tmpl = templateRegistry.get(id);
  if (!tmpl) {
    throw new Error(`Template "${id}" not found in registry.`);
  }
  // Re‑validate for safety
  return TemplateDefinitionSchema.parse(tmpl);
}
