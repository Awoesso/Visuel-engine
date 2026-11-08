import type { ComponentDefinition, ComponentRegistry } from '../schemas/registry';

/**
 * Creates a new ComponentRegistry Map initialized with optional definitions.
 */
export function createComponentRegistry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions: ComponentDefinition<any, any>[] = [],
): ComponentRegistry {
  const registry: ComponentRegistry = new Map();
  for (const def of definitions) {
    registerComponent(registry, def);
  }
  return registry;
}

/**
 * Registers a component definition into the registry.
 */
export function registerComponent(
  registry: ComponentRegistry,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definition: ComponentDefinition<any, any>,
): void {
  if (!definition.type) {
    throw new Error('Component definition must have a valid type identifier');
  }
  registry.set(definition.type, definition);
}

/**
 * Retrieves a component definition by type.
 */
export function getComponentDefinition(
  registry: ComponentRegistry,
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ComponentDefinition<any, any> | undefined {
  return registry.get(type);
}

/**
 * Checks if a component type is registered.
 */
export function isComponentRegistered(registry: ComponentRegistry, type: string): boolean {
  return registry.has(type);
}

/**
 * Validates props against a component's Zod schema.
 */
export function validateComponentProps<T>(
  definition: ComponentDefinition<T>,
  props: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = definition.propsSchema.safeParse(props);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err) => `${err.path.join('.') || 'root'}: ${err.message}`,
  );
  return { success: false, errors };
}
