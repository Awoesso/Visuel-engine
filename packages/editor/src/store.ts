import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { StateCreator, StoreApi } from 'zustand/vanilla';
import { produce } from 'immer';
import {
  CURRENT_SCHEMA_VERSION,
  PageDocumentSchema,
  ResponsiveStylesSchema,
  validateComponentProps,
  validatePageDocument,
} from '@dsk/core';
import type {
  ComponentNode,
  ComponentRegistry,
  ElementStyles,
  PageDocument,
  SectionNode,
} from '@dsk/core';
import { createDefaultComponentRegistry } from './constants';
import type { SaveState } from './persistence';
import type { SectionPreset } from '@dsk/templates';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type NodeId = string;

export const initialDocument: PageDocument = PageDocumentSchema.parse({
  id: 'dsk-editor-demo',
  schemaVersion: CURRENT_SCHEMA_VERSION,
  metadata: {
    title: 'Bienvenue dans DSK Visual Engine',
    description: 'Une page de démonstration éditable.',
    slug: '/editor',
  },
  theme: {},
  sections: [
    {
      id: 'section-demo',
      name: 'Présentation',
      children: [
        {
          id: 'demo-container',
          type: 'core/container',
          props: { maxWidth: 'lg', padding: 'xl', backgroundColor: '#ffffff' },
          children: [
            {
              id: 'demo-heading',
              type: 'core/heading',
              props: { text: 'Bienvenue dans DSK Visual Engine', level: 1, textAlign: 'center' },
            },
            {
              id: 'demo-intro',
              type: 'core/text',
              props: {
                content:
                  'Composez une page avec les composants enregistrés, puis adaptez son aperçu à chaque écran.',
                textAlign: 'center',
              },
            },
            {
              id: 'demo-button',
              type: 'core/button',
              props: { label: 'Découvrir les composants', variant: 'primary', size: 'lg' },
            },
            {
              id: 'demo-grid',
              type: 'core/grid',
              props: { columns: 3, gap: 'md' },
              styles: {
                desktop: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
                tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
                mobile: { gridTemplateColumns: 'minmax(0, 1fr)' },
              },
              children: [
                {
                  id: 'demo-card-layout',
                  type: 'core/container',
                  props: { padding: 'md', backgroundColor: '#f1f5f9' },
                  children: [
                    {
                      id: 'demo-layout-heading',
                      type: 'core/heading',
                      props: { text: 'Mise en page', level: 3 },
                    },
                    {
                      id: 'demo-layout-text',
                      type: 'core/text',
                      props: { content: 'Des conteneurs et grilles réutilisables.' },
                    },
                  ],
                },
                {
                  id: 'demo-card-content',
                  type: 'core/container',
                  props: { padding: 'md', backgroundColor: '#f1f5f9' },
                  children: [
                    {
                      id: 'demo-content-heading',
                      type: 'core/heading',
                      props: { text: 'Contenu', level: 3 },
                    },
                    {
                      id: 'demo-content-text',
                      type: 'core/text',
                      props: { content: 'Titres, textes et boutons configurables.' },
                    },
                  ],
                },
                {
                  id: 'demo-card-responsive',
                  type: 'core/container',
                  props: { padding: 'md', backgroundColor: '#f1f5f9' },
                  children: [
                    {
                      id: 'demo-responsive-heading',
                      type: 'core/heading',
                      props: { text: 'Responsive', level: 3 },
                    },
                    {
                      id: 'demo-responsive-text',
                      type: 'core/text',
                      props: { content: 'Prévisualisez desktop, tablette et mobile.' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

export interface EditorState {
  pages: PageDocument[];
  activePageId: string;
  document: PageDocument;
  selectedNodeId: NodeId | null;
  viewport: ViewportMode;
  zoom: number;
  saveState: SaveState;
  pastDocuments: PageDocument[];
  futureDocuments: PageDocument[];
}
export interface EditorActions {
  createPage: (title?: string) => string;
  switchPage: (pageId: string) => boolean;
  duplicatePage: (pageId: string) => boolean;
  deletePage: (pageId: string) => boolean;
  renamePage: (pageId: string, title: string) => boolean;
  addComponent: (componentId: string) => void;
  addComponentAt: (
    componentId: string,
    targetId: NodeId,
    position: 'before' | 'after' | 'inside',
  ) => boolean;
  addComponentToSection: (componentId: string, sectionId: string) => boolean;
  addSection: (preset: SectionPreset) => void;
  selectNode: (nodeId: NodeId | null) => void;
  updateNodeName: (nodeId: NodeId, name: string) => boolean;
  setNodeLocked: (nodeId: NodeId, locked: boolean) => boolean;
  setNodeHidden: (nodeId: NodeId, hidden: boolean) => boolean;
  updateSectionName: (sectionId: string, name: string) => boolean;
  setSectionLocked: (sectionId: string, locked: boolean) => boolean;
  setSectionHidden: (sectionId: string, hidden: boolean) => boolean;
  updateNodeProps: (nodeId: NodeId, props: Partial<ComponentNode['props']>) => void;
  updateNodeStyles: (nodeId: NodeId, mode: ViewportMode, styles: Partial<ElementStyles>) => void;
  deleteNode: (nodeId: NodeId) => boolean;
  duplicateNode: (nodeId: NodeId) => boolean;
  moveNode: (nodeId: NodeId, targetId: NodeId, position: 'before' | 'after' | 'inside') => boolean;
  moveNodeToSection: (nodeId: NodeId, sectionId: string) => boolean;
  moveNodeBy: (nodeId: NodeId, direction: -1 | 1) => void;
  undo: () => void;
  redo: () => void;
  updateDocumentTitle: (title: string) => void;
  setViewport: (mode: ViewportMode) => void;
  setZoom: (zoom: number) => void;
  replaceDocument: (document: PageDocument) => void;
  resetDemo: () => void;
  setSaveState: (saveState: SaveState) => void;
  setComponentRegistry: (registry: ComponentRegistry) => void;
}

export type EditorStore = EditorState & EditorActions;
export type EditorStoreApi = StoreApi<EditorStore>;

export interface EditorStoreOptions {
  document?: PageDocument;
  registry?: ComponentRegistry;
}

interface HistoryGroupState {
  last: { key: string; timestamp: number } | null;
}

const HISTORY_LIMIT = 50;
const HISTORY_GROUP_WINDOW_MS = 750;

function findNode(nodes: ComponentNode[], nodeId: NodeId): ComponentNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    const childMatch = findNode(node.children, nodeId);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
}

function findNodeLockState(
  nodes: ComponentNode[],
  nodeId: NodeId,
  inheritedLocked: boolean,
): { locked: boolean; inheritedLocked: boolean } | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return { locked: node.locked, inheritedLocked };
    }

    const nested = findNodeLockState(node.children, nodeId, inheritedLocked || node.locked);
    if (nested) return nested;
  }
  return undefined;
}

export function isNodeEffectivelyLocked(document: PageDocument, nodeId: NodeId): boolean {
  const section = document.sections.find((candidate) => candidate.id === nodeId);
  if (section) return section.locked;

  for (const candidate of document.sections) {
    const lockState = findNodeLockState(candidate.children, nodeId, candidate.locked);
    if (lockState) return lockState.locked || lockState.inheritedLocked;
  }
  return false;
}

function isNodeLockedByAncestor(document: PageDocument, nodeId: NodeId): boolean {
  for (const section of document.sections) {
    if (section.id === nodeId) return false;
    const lockState = findNodeLockState(section.children, nodeId, section.locked);
    if (lockState) return lockState.inheritedLocked;
  }
  return false;
}

function containsNodeId(document: PageDocument, nodeId: NodeId): boolean {
  return document.sections.some(
    (section) => section.id === nodeId || findNode(section.children, nodeId) !== undefined,
  );
}

function findNodeLocation(
  sections: PageDocument['sections'],
  nodeId: NodeId,
): { list: ComponentNode[]; index: number; parent: ComponentNode | null } | undefined {
  const search = (
    list: ComponentNode[],
    parent: ComponentNode | null,
  ): { list: ComponentNode[]; index: number; parent: ComponentNode | null } | undefined => {
    for (let index = 0; index < list.length; index += 1) {
      const node = list[index];
      if (!node) continue;
      if (node.id === nodeId) return { list, index, parent };
      const nested = search(node.children, node);
      if (nested) return nested;
    }
    return undefined;
  };

  for (const section of sections) {
    const location = search(section.children, null);
    if (location) return location;
  }
  return undefined;
}

function isAllowedChild(
  parent: ComponentNode,
  childType: string,
  registry: ComponentRegistry,
): boolean {
  const definition = registry.get(parent.type);
  return Boolean(
    definition?.canHaveChildren &&
    (!definition.allowedChildren || definition.allowedChildren.includes(childType)),
  );
}

function cloneWithFreshIds(
  node: ComponentNode,
  document: PageDocument,
  createNodeId: (document: PageDocument) => string,
): ComponentNode {
  return {
    ...node,
    id: createNodeId(document),
    props: { ...node.props },
    styles: {
      desktop: { ...node.styles.desktop },
      tablet: { ...node.styles.tablet },
      mobile: { ...node.styles.mobile },
    },
    children: node.children.map((child) => cloneWithFreshIds(child, document, createNodeId)),
  };
}

function createComponentNode(
  componentId: string,
  document: PageDocument,
  createNodeId: (document: PageDocument) => string,
  registry: ComponentRegistry,
): ComponentNode | undefined {
  const definition = registry.get(componentId);
  if (!definition) return undefined;
  return {
    id: createNodeId(document),
    type: componentId,
    version: definition.version,
    props: { ...definition.defaultProps },
    styles: { desktop: {}, tablet: {}, mobile: {} },
    children: [],
    locked: false,
    hidden: false,
  };
}

export function assertValidDocument(document: PageDocument): void {
  const result = validatePageDocument(document);
  if (!result.success) {
    throw new Error(
      `Document update rejected: ${result.errors.map((error) => error.message).join('; ')}`,
    );
  }
}

function createEditorState(
  options: EditorStoreOptions = {},
): StateCreator<EditorStore, [], [], EditorStore> {
  const initialPage = PageDocumentSchema.parse(options.document ?? initialDocument);
  assertValidDocument(initialPage);
  let componentRegistry = options.registry ?? createDefaultComponentRegistry();
  let nextPageId = 0n;
  let nextNodeId = 0;
  const historyGroup: HistoryGroupState = { last: null };

  const createUniquePageId = (pages: readonly PageDocument[]): string => {
    const existingIds = new Set(pages.map((page) => page.id));
    let pageId: string;
    do {
      nextPageId += 1n;
      pageId = `page-${nextPageId}`;
    } while (existingIds.has(pageId));
    return pageId;
  };

  const createNodeId = (document: PageDocument, prefix = 'editor-node'): string => {
    let nodeId: string;
    do {
      nodeId = `${prefix}-${++nextNodeId}`;
    } while (containsNodeId(document, nodeId));
    return nodeId;
  };

  return (set, get) => ({
    pages: [initialPage],
    activePageId: initialPage.id,
    document: initialPage,
    selectedNodeId: null,
    viewport: 'desktop',
    zoom: 0.5,
    saveState: { status: 'idle', lastSavedAt: null, error: null },
    pastDocuments: [],
    futureDocuments: [],
    setComponentRegistry: (registry) => {
      componentRegistry = registry;
    },
    createPage: (title) => {
      const pages = get().pages;
      const pageCount = pages.length + 1;
      const pageTitle = title?.trim() || `Page ${pageCount}`;
      const pageId = createUniquePageId(pages);
      const newPage: PageDocument = PageDocumentSchema.parse({
        id: pageId,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        metadata: {
          title: pageTitle,
          description: `Page ${pageTitle}`,
          slug: `/${pageTitle.toLowerCase().replace(/\s+/g, '-')}`,
        },
        theme: {},
        sections: [
          {
            id: `section-${Date.now()}`,
            name: 'Section principale',
            children: [],
            locked: false,
            hidden: false,
          },
        ],
      });
      set((state) => ({
        pages: [...state.pages, newPage],
        activePageId: newPage.id,
        document: newPage,
        selectedNodeId: null,
        pastDocuments: [],
        futureDocuments: [],
      }));
      return pageId;
    },
    switchPage: (pageId) => {
      const targetPage = get().pages.find((p) => p.id === pageId);
      if (!targetPage) return false;
      set({
        activePageId: targetPage.id,
        document: targetPage,
        selectedNodeId: null,
        pastDocuments: [],
        futureDocuments: [],
      });
      return true;
    },
    duplicatePage: (pageId) => {
      const pages = get().pages;
      const targetPage = pages.find((p) => p.id === pageId);
      if (!targetPage) return false;
      const newPageId = createUniquePageId(pages);
      const newTitle = `${targetPage.metadata.title} (Copie)`;
      const duplicated: PageDocument = PageDocumentSchema.parse({
        ...targetPage,
        id: newPageId,
        metadata: {
          ...targetPage.metadata,
          title: newTitle,
          slug: `/${newTitle.toLowerCase().replace(/\s+/g, '-')}`,
        },
      });
      set((state) => ({
        pages: [...state.pages, duplicated],
        activePageId: duplicated.id,
        document: duplicated,
        selectedNodeId: null,
        pastDocuments: [],
        futureDocuments: [],
      }));
      return true;
    },
    deletePage: (pageId) => {
      const state = get();
      if (state.pages.length <= 1 || !state.pages.some((page) => page.id === pageId)) {
        return false;
      }

      const nextPages = state.pages.filter((page) => page.id !== pageId);
      const deletingActivePage = state.activePageId === pageId;
      const nextActivePage = deletingActivePage ? nextPages[0]! : state.document;
      set({
        pages: nextPages,
        activePageId: deletingActivePage ? nextActivePage.id : state.activePageId,
        document: nextActivePage,
        selectedNodeId: deletingActivePage ? null : state.selectedNodeId,
        pastDocuments: [],
        futureDocuments: [],
      });
      return true;
    },
    renamePage: (pageId, title) => {
      const trimmed = title.trim();
      if (!trimmed) return false;
      set((state) => {
        const nextPages = state.pages.map((p) =>
          p.id === pageId ? { ...p, metadata: { ...p.metadata, title: trimmed } } : p,
        );
        const isCurrent = state.activePageId === pageId;
        return {
          pages: nextPages,
          document: isCurrent
            ? { ...state.document, metadata: { ...state.document.metadata, title: trimmed } }
            : state.document,
        };
      });
      return true;
    },
    addComponent: (componentId) => {
      const currentDocument = get().document;
      const newNode = createComponentNode(
        componentId,
        currentDocument,
        createNodeId,
        componentRegistry,
      );
      if (!newNode) {
        throw new Error(`Cannot add unregistered component "${componentId}".`);
      }

      const nodeId = newNode.id;
      const selectedNodeId = get().selectedNodeId;
      const selectedLocation =
        selectedNodeId && !isNodeEffectivelyLocked(currentDocument, selectedNodeId)
          ? findNodeLocation(currentDocument.sections, selectedNodeId)
          : undefined;
      const selected = selectedLocation?.list[selectedLocation.index];
      const parentTarget =
        selected && isAllowedChild(selected, componentId, componentRegistry) ? selected : undefined;
      const destinationSection = currentDocument.sections.find((section) => !section.locked);
      const destinationList = parentTarget
        ? parentTarget.children
        : (selectedLocation?.list ?? destinationSection?.children);
      if (!destinationList) {
        throw new Error('The editor document must contain a section before adding components.');
      }
      const destinationParent = parentTarget ?? selectedLocation?.parent ?? null;
      if (destinationParent && !isAllowedChild(destinationParent, componentId, componentRegistry)) {
        throw new Error(
          `Component "${componentId}" is not allowed inside "${destinationParent.type}".`,
        );
      }

      const candidate = produce(currentDocument, (draft) => {
        const list = parentTarget
          ? findNode(
              draft.sections.flatMap((section) => section.children),
              parentTarget.id,
            )?.children
          : selectedLocation
            ? findNodeLocation(draft.sections, selected?.id ?? '')?.list
            : draft.sections.find((section) => section.id === destinationSection?.id)?.children;
        if (!list) throw new Error('Unable to resolve the insertion point.');
        if (parentTarget) {
          list.push(newNode);
        } else {
          const index = selectedLocation
            ? list.findIndex((node) => node.id === selected?.id) + 1
            : list.length;
          list.splice(index, 0, newNode);
        }
      });
      commitForInstance(set, historyGroup, candidate, nodeId);
    },
    addComponentAt: (componentId, targetId, position) => {
      const current = get().document;
      const newNode = createComponentNode(componentId, current, createNodeId, componentRegistry);
      const targetLocation = findNodeLocation(current.sections, targetId);
      const target = targetLocation?.list[targetLocation.index];
      if (!newNode || !target || !targetLocation) return false;
      if (isNodeEffectivelyLocked(current, targetId)) return false;
      const parent = position === 'inside' ? target : targetLocation.parent;
      if (parent && !isAllowedChild(parent, componentId, componentRegistry)) return false;
      if (position === 'inside' && !componentRegistry.get(target.type)?.canHaveChildren)
        return false;

      const candidate = produce(current, (draft) => {
        if (position === 'inside') {
          const destination = findNode(
            draft.sections.flatMap((section) => section.children),
            targetId,
          );
          destination?.children.push(newNode);
          return;
        }
        const location = findNodeLocation(draft.sections, targetId);
        if (!location) return;
        const index = location.index + (position === 'after' ? 1 : 0);
        location.list.splice(index, 0, newNode);
      });
      if (!validatePageDocument(candidate).success) return false;
      commitForInstance(set, historyGroup, candidate, newNode.id);
      return true;
    },
    addComponentToSection: (componentId, sectionId) => {
      const current = get().document;
      const section = current.sections.find((candidate) => candidate.id === sectionId);
      const newNode = createComponentNode(componentId, current, createNodeId, componentRegistry);
      if (!section || section.locked || !newNode) return false;
      const candidate = produce(current, (draft) => {
        draft.sections.find((candidate) => candidate.id === sectionId)?.children.push(newNode);
      });
      if (!validatePageDocument(candidate).success) return false;
      commitForInstance(set, historyGroup, candidate, newNode.id);
      return true;
    },
    addSection: (preset) => {
      const current = get().document;
      let sectionId: string;
      sectionId = createNodeId(current, 'editor-section');
      const section: SectionNode = {
        ...preset.section,
        id: sectionId,
        children: preset.section.children.map((node) =>
          cloneWithFreshIds(node, current, createNodeId),
        ),
        styles: {
          desktop: { ...preset.section.styles.desktop },
          tablet: { ...preset.section.styles.tablet },
          mobile: { ...preset.section.styles.mobile },
        },
      };
      const candidate = produce(current, (draft) => {
        draft.sections.push(section);
      });
      commitForInstance(set, historyGroup, candidate, section.children[0]?.id ?? null);
    },
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    updateNodeName: (nodeId, name) => {
      const current = get().document;
      if (isNodeEffectivelyLocked(current, nodeId)) return false;
      const candidate = produce(current, (draft) => {
        const node = draft.sections
          .map((section) => findNode(section.children, nodeId))
          .find((match) => match !== undefined);
        if (!node) return;
        const normalizedName = name.trim();
        if (normalizedName) node.name = normalizedName;
        else delete node.name;
      });
      if (candidate === current) return false;
      commitForInstance(set, historyGroup, candidate, get().selectedNodeId, `name:${nodeId}`, {
        skipFullValidation: true,
      });
      return true;
    },
    setNodeLocked: (nodeId, locked) => {
      const current = get().document;
      if (isNodeLockedByAncestor(current, nodeId)) return false;
      const nodeExists = current.sections.some(
        (section) => findNode(section.children, nodeId) !== undefined,
      );
      if (!nodeExists) return false;
      const candidate = produce(current, (draft) => {
        const node = draft.sections
          .map((section) => findNode(section.children, nodeId))
          .find((match) => match !== undefined);
        if (node) node.locked = locked;
      });
      if (candidate === current) return true;
      commitForInstance(set, historyGroup, candidate, get().selectedNodeId, undefined, {
        skipFullValidation: true,
      });
      return true;
    },
    setNodeHidden: (nodeId, hidden) => {
      const current = get().document;
      if (isNodeLockedByAncestor(current, nodeId)) return false;
      const nodeExists = current.sections.some(
        (section) => findNode(section.children, nodeId) !== undefined,
      );
      if (!nodeExists) return false;
      const candidate = produce(current, (draft) => {
        const node = draft.sections
          .map((section) => findNode(section.children, nodeId))
          .find((match) => match !== undefined);
        if (node) node.hidden = hidden;
      });
      if (candidate === current) return true;
      commitForInstance(set, historyGroup, candidate, get().selectedNodeId, undefined, {
        skipFullValidation: true,
      });
      return true;
    },
    updateSectionName: (sectionId, name) => {
      const current = get().document;
      const section = current.sections.find((candidate) => candidate.id === sectionId);
      const normalizedName = name.trim();
      if (!section || section.locked || !normalizedName) return false;
      if (section.name === normalizedName) return true;
      const candidate = produce(current, (draft) => {
        const draftSection = draft.sections.find((item) => item.id === sectionId);
        if (draftSection) draftSection.name = normalizedName;
      });
      commitForInstance(
        set,
        historyGroup,
        candidate,
        get().selectedNodeId,
        `section-name:${sectionId}`,
        {
          skipFullValidation: true,
        },
      );
      return true;
    },
    setSectionLocked: (sectionId, locked) => {
      const current = get().document;
      const section = current.sections.find((candidate) => candidate.id === sectionId);
      if (!section) return false;
      if (section.locked === locked) return true;
      const candidate = produce(current, (draft) => {
        const draftSection = draft.sections.find((item) => item.id === sectionId);
        if (draftSection) draftSection.locked = locked;
      });
      commitForInstance(set, historyGroup, candidate, get().selectedNodeId, undefined, {
        skipFullValidation: true,
      });
      return true;
    },
    setSectionHidden: (sectionId, hidden) => {
      const current = get().document;
      const section = current.sections.find((candidate) => candidate.id === sectionId);
      if (!section) return false;
      if (section.hidden === hidden) return true;
      const candidate = produce(current, (draft) => {
        const draftSection = draft.sections.find((item) => item.id === sectionId);
        if (draftSection) draftSection.hidden = hidden;
      });
      commitForInstance(set, historyGroup, candidate, get().selectedNodeId, undefined, {
        skipFullValidation: true,
      });
      return true;
    },
    updateNodeProps: (nodeId, props) => {
      const current = get().document;
      if (isNodeEffectivelyLocked(current, nodeId)) {
        throw new Error(`Cannot update locked component "${nodeId}".`);
      }
      const node = current.sections
        .map((section) => findNode(section.children, nodeId))
        .find((match) => match !== undefined);
      if (!node) return;
      const definition = componentRegistry.get(node.type);
      if (!definition) throw new Error(`Cannot update unregistered component "${node.type}".`);
      const parsed = validateComponentProps(definition, { ...node.props, ...props });
      if (!parsed.success) throw new Error(`Invalid properties: ${parsed.errors.join('; ')}`);

      const candidate = produce(current, (draft) => {
        const draftNode = draft.sections
          .map((section) => findNode(section.children, nodeId))
          .find((match) => match !== undefined);
        if (draftNode) draftNode.props = parsed.data;
      });
      commitForInstance(set, historyGroup, candidate, nodeId, `props:${nodeId}`, {
        skipFullValidation: true,
      });
    },
    updateNodeStyles: (nodeId, mode, styles) => {
      const current = get().document;
      if (isNodeEffectivelyLocked(current, nodeId)) {
        throw new Error(`Cannot update styles for locked component "${nodeId}".`);
      }
      const candidate = produce(current, (draft) => {
        const node = draft.sections
          .map((section) => findNode(section.children, nodeId))
          .find((match) => match !== undefined);
        if (!node) return;
        const nextStyles = { ...node.styles[mode], ...styles };
        for (const key of Object.keys(styles) as (keyof ElementStyles)[]) {
          if (styles[key] === '' || styles[key] === undefined) delete nextStyles[key];
        }
        node.styles[mode] = nextStyles;
        const parsed = ResponsiveStylesSchema.safeParse(node.styles);
        if (!parsed.success) throw new Error(`Invalid responsive styles: ${parsed.error.message}`);
        node.styles = parsed.data;
      });
      if (candidate === current) return;
      commitForInstance(set, historyGroup, candidate, nodeId, `styles:${nodeId}`, {
        skipFullValidation: true,
      });
    },
    deleteNode: (nodeId) => {
      const current = get().document;
      if (isNodeEffectivelyLocked(current, nodeId)) return false;
      const location = findNodeLocation(current.sections, nodeId);
      if (!location) return false;
      const candidate = produce(current, (draft) => {
        const draftLocation = findNodeLocation(draft.sections, nodeId);
        if (draftLocation) draftLocation.list.splice(draftLocation.index, 1);
      });
      const selected = get().selectedNodeId;
      const selectedWasDeleted =
        selected === nodeId || (selected !== null && isDescendantOf(current, nodeId, selected));
      commitForInstance(set, historyGroup, candidate, selectedWasDeleted ? null : selected);
      return true;
    },
    duplicateNode: (nodeId) => {
      const current = get().document;
      if (isNodeEffectivelyLocked(current, nodeId)) return false;
      const location = findNodeLocation(current.sections, nodeId);
      if (!location) return false;
      const original = location.list[location.index];
      if (!original) return false;
      const duplicate = cloneWithFreshIds(original, current, createNodeId);
      const candidate = produce(current, (draft) => {
        const draftLocation = findNodeLocation(draft.sections, nodeId);
        if (draftLocation) draftLocation.list.splice(draftLocation.index + 1, 0, duplicate);
      });
      commitForInstance(set, historyGroup, candidate, duplicate.id);
      return true;
    },
    moveNode: (nodeId, targetId, position) => {
      if (nodeId === targetId) return false;
      const current = get().document;
      if (isNodeEffectivelyLocked(current, nodeId) || isNodeEffectivelyLocked(current, targetId)) {
        return false;
      }
      if (isDescendantOf(current, nodeId, targetId)) return false;
      const sourceLocation = findNodeLocation(current.sections, nodeId);
      const targetLocation = findNodeLocation(current.sections, targetId);
      const source = sourceLocation?.list[sourceLocation.index];
      const target = targetLocation?.list[targetLocation.index];
      if (!source || !target || !sourceLocation || !targetLocation) return false;

      const destinationParent = position === 'inside' ? target : targetLocation.parent;
      if (destinationParent && !isAllowedChild(destinationParent, source.type, componentRegistry))
        return false;
      if (position === 'inside' && !componentRegistry.get(target.type)?.canHaveChildren)
        return false;

      const candidate = produce(current, (draft) => {
        const draftSource = findNodeLocation(draft.sections, nodeId);
        if (!draftSource) return;
        const [moved] = draftSource.list.splice(draftSource.index, 1);
        if (!moved) return;
        if (position === 'inside') {
          const destination = findNode(
            draft.sections.flatMap((section) => section.children),
            targetId,
          );
          destination?.children.push(moved);
        } else {
          const destination = findNodeLocation(draft.sections, targetId);
          if (!destination) return;
          const targetIndex = destination.list.findIndex((node) => node.id === targetId);
          const insertIndex = targetIndex + (position === 'after' ? 1 : 0);
          destination.list.splice(insertIndex, 0, moved);
        }
      });
      if (!validatePageDocument(candidate).success) return false;
      commitForInstance(set, historyGroup, candidate, nodeId);
      return true;
    },
    moveNodeToSection: (nodeId, sectionId) => {
      const current = get().document;
      const sourceLocation = findNodeLocation(current.sections, nodeId);
      const section = current.sections.find((candidate) => candidate.id === sectionId);
      if (!sourceLocation || !section || section.locked || isNodeEffectivelyLocked(current, nodeId))
        return false;
      const candidate = produce(current, (draft) => {
        const location = findNodeLocation(draft.sections, nodeId);
        const destination = draft.sections.find((candidate) => candidate.id === sectionId);
        if (!location || !destination) return;
        const [moved] = location.list.splice(location.index, 1);
        if (moved) destination.children.push(moved);
      });
      if (!validatePageDocument(candidate).success) return false;
      commitForInstance(set, historyGroup, candidate, nodeId);
      return true;
    },
    moveNodeBy: (nodeId, direction) => {
      const current = get().document;
      const location = findNodeLocation(current.sections, nodeId);
      if (!location) return;
      const target = location.list[location.index + direction];
      if (target) get().moveNode(nodeId, target.id, direction < 0 ? 'before' : 'after');
    },
    undo: () => {
      historyGroup.last = null;
      set((state) => {
        const previousDocument = state.pastDocuments.at(-1);
        if (!previousDocument) return state;
        return {
          document: previousDocument,
          selectedNodeId: null,
          pastDocuments: state.pastDocuments.slice(0, -1),
          futureDocuments: [state.document, ...state.futureDocuments].slice(0, HISTORY_LIMIT),
        };
      });
    },
    redo: () => {
      historyGroup.last = null;
      set((state) => {
        const nextDocument = state.futureDocuments[0];
        if (!nextDocument) return state;
        return {
          document: nextDocument,
          selectedNodeId: null,
          pastDocuments: [...state.pastDocuments, state.document].slice(-HISTORY_LIMIT),
          futureDocuments: state.futureDocuments.slice(1),
        };
      });
    },
    updateDocumentTitle: (title) => {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        throw new Error('Document title cannot be empty.');
      }

      const currentDocument = get().document;
      if (currentDocument.metadata.title === normalizedTitle) return;
      const candidate = PageDocumentSchema.parse({
        ...currentDocument,
        metadata: { ...currentDocument.metadata, title: normalizedTitle },
      });
      commitForInstance(set, historyGroup, candidate, get().selectedNodeId, 'metadata:title', {
        skipFullValidation: true,
      });
    },
    setViewport: (mode) => set({ viewport: mode }),
    setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.25, Math.round(zoom * 100) / 100)) }),
    replaceDocument: (document) => {
      assertValidDocument(document);
      historyGroup.last = null;
      set((state) => {
        const pageIndex = state.pages.findIndex((p) => p.id === document.id);
        const nextPages =
          pageIndex >= 0
            ? state.pages.map((p, idx) => (idx === pageIndex ? document : p))
            : [document];
        return {
          pages: nextPages,
          activePageId: document.id,
          document,
          selectedNodeId: null,
          pastDocuments: [],
          futureDocuments: [],
        };
      });
    },
    resetDemo: () => {
      const candidate = PageDocumentSchema.parse(initialDocument);
      assertValidDocument(candidate);
      set({
        pages: [candidate],
        activePageId: candidate.id,
        document: candidate,
        selectedNodeId: null,
        pastDocuments: [],
        futureDocuments: [],
      });
    },
    setSaveState: (saveState) => set({ saveState }),
  });
}

export function createEditorStore(options: EditorStoreOptions = {}): EditorStoreApi {
  return createStore<EditorStore>()(createEditorState(options));
}

export const useEditorStore = create<EditorStore>()(createEditorState());

export interface CommitOptions {
  skipFullValidation?: boolean;
}

export function commitDocument(
  set: (
    partial:
      | Partial<EditorState & EditorActions>
      | ((state: EditorState & EditorActions) => Partial<EditorState & EditorActions>),
  ) => void,
  document: PageDocument,
  selectedNodeId: NodeId | null,
  groupKey?: string,
  options?: CommitOptions,
  historyGroup: HistoryGroupState = { last: null },
): void {
  if (!options?.skipFullValidation) {
    assertValidDocument(document);
  }
  const timestamp = Date.now();
  set((state) => {
    const grouped =
      groupKey !== undefined &&
      historyGroup.last?.key === groupKey &&
      timestamp - historyGroup.last.timestamp <= HISTORY_GROUP_WINDOW_MS;
    historyGroup.last = groupKey ? { key: groupKey, timestamp } : null;
    const pageIndex = state.pages.findIndex(
      (p) => p.id === state.activePageId || p.id === document.id,
    );
    const updatedPages =
      pageIndex >= 0
        ? state.pages.map((p, idx) => (idx === pageIndex ? document : p))
        : [...state.pages, document];
    return {
      pages: updatedPages,
      activePageId: document.id,
      document,
      selectedNodeId,
      pastDocuments: grouped
        ? state.pastDocuments
        : [...state.pastDocuments, state.document].slice(-HISTORY_LIMIT),
      futureDocuments: [],
    };
  });
}

function commitForInstance(
  set: Parameters<typeof commitDocument>[0],
  historyGroup: HistoryGroupState,
  document: PageDocument,
  selectedNodeId: NodeId | null,
  groupKey?: string,
  options?: CommitOptions,
): void {
  commitDocument(set, document, selectedNodeId, groupKey, options, historyGroup);
}

function isDescendantOf(document: PageDocument, ancestorId: string, candidateId: string): boolean {
  const ancestor = document.sections
    .map((section) => findNode(section.children, ancestorId))
    .find((node) => node !== undefined);
  return Boolean(ancestor && findNode(ancestor.children, candidateId));
}
