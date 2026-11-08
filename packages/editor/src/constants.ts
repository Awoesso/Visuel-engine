import {
  buttonDefinition,
  containerDefinition,
  gridDefinition,
  headingDefinition,
  imageDefinition,
  spacerDefinition,
  dividerDefinition,
  stackDefinition,
  textDefinition,
} from '@dsk/components';
import type { ComponentDefinition } from '@dsk/core';
import type { ComponentRegistry } from '@dsk/core';
import { defaultRendererRegistry } from '@dsk/components';
import type { EditorRegistry } from './config';

export const AVAILABLE_COMPONENTS: ComponentDefinition[] = [
  containerDefinition,
  gridDefinition,
  stackDefinition,
  headingDefinition,
  textDefinition,
  buttonDefinition,
  imageDefinition,
  spacerDefinition,
  dividerDefinition,
];

export function createDefaultComponentRegistry(): ComponentRegistry {
  return new Map(AVAILABLE_COMPONENTS.map((definition) => [definition.type, definition]));
}

export const defaultEditorRegistry: EditorRegistry = {
  definitions: createDefaultComponentRegistry(),
  renderers: defaultRendererRegistry,
};

const componentsById = new Map(
  AVAILABLE_COMPONENTS.map((definition) => [definition.type, definition]),
);

export function getDefaultComponent(type: string): ComponentDefinition | undefined {
  return componentsById.get(type);
}
