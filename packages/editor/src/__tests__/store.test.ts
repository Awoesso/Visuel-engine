import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultComponentRegistry } from '../constants';
import { createEditorStore, initialDocument, useEditorStore } from '../store';
import { SECTION_PRESETS } from '@dsk/templates';
import { validatePageDocument } from '@dsk/core';

function getNodeIds(nodes: (typeof initialDocument.sections)[number]['children']): string[] {
  return nodes.flatMap((node) => [node.id, ...getNodeIds(node.children)]);
}

function findTestNode(
  nodes: (typeof initialDocument.sections)[number]['children'],
  nodeId: string,
): (typeof initialDocument.sections)[number]['children'][number] | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findTestNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

function resetStore(): void {
  useEditorStore.getState().resetDemo();
}

describe('editor document actions', () => {
  beforeEach(resetStore);

  it('creates independent stores with isolated documents, pages, selection, and history', () => {
    const firstStore = createEditorStore();
    const secondStore = createEditorStore({ document: initialDocument });
    const initialTitle = secondStore.getState().document.metadata.title;

    expect(firstStore.getState().document).not.toBe(secondStore.getState().document);

    firstStore.getState().selectNode('demo-heading');
    firstStore.getState().updateDocumentTitle('First instance');

    expect(firstStore.getState().pastDocuments).toHaveLength(1);
    expect(firstStore.getState().selectedNodeId).toBe('demo-heading');
    expect(secondStore.getState().document.metadata.title).toBe(initialTitle);
    expect(secondStore.getState().pastDocuments).toHaveLength(0);
    expect(secondStore.getState().selectedNodeId).toBeNull();

    firstStore.getState().undo();
    expect(firstStore.getState().document.metadata.title).toBe(initialTitle);
    expect(secondStore.getState().document.metadata.title).toBe(initialTitle);

    firstStore.getState().createPage('First instance page');
    expect(firstStore.getState().pages).toHaveLength(2);
    expect(secondStore.getState().pages).toHaveLength(1);
    expect(secondStore.getState().activePageId).toBe(initialDocument.id);
  });

  it('updates component definitions without replacing the document or its history', () => {
    const registry = createDefaultComponentRegistry();
    registry.delete('core/button');
    const store = createEditorStore({ registry });

    expect(() => store.getState().addComponent('core/button')).toThrow(
      'Cannot add unregistered component "core/button".',
    );

    const document = store.getState().document;
    store.getState().updateDocumentTitle('Keep this document');
    const updatedDocument = store.getState().document;
    store.getState().setComponentRegistry(createDefaultComponentRegistry());

    expect(store.getState().document).toBe(updatedDocument);
    expect(store.getState().document).not.toBe(document);
    expect(store.getState().pastDocuments).toHaveLength(1);
    store.getState().addComponent('core/button');
    expect(store.getState().document.sections[0]?.children.at(-1)?.type).toBe('core/button');
  });

  it('renames the document and supports undo and redo', () => {
    const originalTitle = useEditorStore.getState().document.metadata.title;
    useEditorStore.getState().updateDocumentTitle('Landing page');

    expect(useEditorStore.getState().document.metadata.title).toBe('Landing page');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.metadata.title).toBe(originalTitle);
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document.metadata.title).toBe('Landing page');
  });

  it('rejects an empty document title', () => {
    const originalDocument = useEditorStore.getState().document;
    expect(() => useEditorStore.getState().updateDocumentTitle('   ')).toThrow(
      'Document title cannot be empty.',
    );
    expect(useEditorStore.getState().document).toBe(originalDocument);
  });

  it('renames, hides, and locks nodes while preventing edits through locked ancestors', () => {
    const store = useEditorStore.getState();
    expect(store.updateNodeName('demo-heading', 'Hero title')).toBe(true);
    expect(store.setNodeHidden('demo-heading', true)).toBe(true);
    expect(
      findTestNode(useEditorStore.getState().document.sections[0]!.children, 'demo-heading'),
    ).toMatchObject({ name: 'Hero title', hidden: true });

    expect(store.setNodeLocked('demo-container', true)).toBe(true);
    expect(store.addComponentAt('core/text', 'demo-heading', 'after')).toBe(false);
    expect(store.updateNodeName('demo-heading', 'Updated title')).toBe(false);
    expect(store.setNodeHidden('demo-heading', false)).toBe(false);
    expect(store.setNodeLocked('demo-heading', false)).toBe(false);
    expect(store.duplicateNode('demo-heading')).toBe(false);
    expect(store.deleteNode('demo-heading')).toBe(false);
    expect(store.moveNode('demo-heading', 'demo-intro', 'after')).toBe(false);
    expect(() => store.updateNodeProps('demo-heading', { text: 'Locked edit' })).toThrow(
      'Cannot update locked component "demo-heading".',
    );
    expect(() => store.updateNodeStyles('demo-heading', 'desktop', { color: '#000000' })).toThrow(
      'Cannot update styles for locked component "demo-heading".',
    );

    expect(store.setNodeLocked('demo-container', false)).toBe(true);
    expect(store.updateNodeName('demo-heading', 'Updated title')).toBe(true);
  });

  it('renames sections and prevents edits inside locked sections', () => {
    const store = useEditorStore.getState();
    expect(store.updateSectionName('section-demo', 'Hero area')).toBe(true);
    expect(store.setSectionHidden('section-demo', true)).toBe(true);
    expect(store.setSectionLocked('section-demo', true)).toBe(true);
    expect(store.addComponentToSection('core/text', 'section-demo')).toBe(false);
    expect(store.setNodeLocked('demo-heading', true)).toBe(false);
    expect(store.updateSectionName('section-demo', 'Locked area')).toBe(false);
    expect(useEditorStore.getState().document.sections[0]).toMatchObject({
      name: 'Hero area',
      hidden: true,
      locked: true,
    });
    expect(store.setSectionLocked('section-demo', false)).toBe(true);
  });

  it('inserts a component into a selected container and selects it', () => {
    const store = useEditorStore.getState();
    store.selectNode('demo-container');
    store.addComponent('core/grid');

    const state = useEditorStore.getState();
    const container = state.document.sections[0]?.children[0];
    const grid = container?.children.at(-1);
    expect(grid?.type).toBe('core/grid');
    expect(state.selectedNodeId).toBe(grid?.id);
  });

  it('duplicates a nested subtree with fresh ids and deletes the selection', () => {
    const original = useEditorStore.getState().document;
    useEditorStore.getState().duplicateNode('demo-container');

    let state = useEditorStore.getState();
    const roots = state.document.sections[0]?.children ?? [];
    expect(roots).toHaveLength(2);
    expect(roots[1]?.children).toHaveLength(4);
    const allIds = getNodeIds(roots);
    expect(allIds).toHaveLength(28);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(original.sections[0]?.children).toHaveLength(1);
    expect(state.selectedNodeId).toBe(roots[1]?.id);

    state.deleteNode(roots[1]!.id);
    state = useEditorStore.getState();
    expect(state.document.sections[0]?.children).toHaveLength(1);
    expect(state.selectedNodeId).toBeNull();
  });

  it('reorders siblings while rejecting invalid nesting and cycles', () => {
    const before = useEditorStore.getState().document;
    expect(useEditorStore.getState().moveNode('demo-button', 'demo-heading', 'before')).toBe(true);
    let container = useEditorStore.getState().document.sections[0]?.children[0];
    expect(container?.children[0]?.id).toBe('demo-button');
    expect(before.sections[0]?.children[0]?.children[0]?.id).toBe('demo-heading');

    expect(useEditorStore.getState().moveNode('demo-container', 'demo-heading', 'inside')).toBe(
      false,
    );
    expect(useEditorStore.getState().moveNode('demo-button', 'demo-heading', 'inside')).toBe(false);
    expect(useEditorStore.getState().moveNode('demo-heading', 'demo-grid', 'inside')).toBe(true);
    container = useEditorStore.getState().document.sections[0]?.children[0];
    expect(container?.children.find((node) => node.id === 'demo-grid')?.children.at(-1)?.id).toBe(
      'demo-heading',
    );
  });

  it('rejects moving a node relative to one of its descendants without changing the document', () => {
    const before = useEditorStore.getState().document;

    expect(useEditorStore.getState().moveNode('demo-container', 'demo-heading', 'before')).toBe(
      false,
    );
    expect(useEditorStore.getState().moveNode('demo-container', 'demo-heading', 'after')).toBe(
      false,
    );
    expect(useEditorStore.getState().moveNode('demo-container', 'demo-heading', 'inside')).toBe(
      false,
    );
    expect(useEditorStore.getState().document).toBe(before);
  });

  it('groups property edits into one undo step and supports redo', () => {
    const store = useEditorStore.getState();
    store.updateNodeProps('demo-heading', { text: 'First edit' });
    useEditorStore.getState().updateNodeProps('demo-heading', { text: 'Final edit' });

    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.props.text,
    ).toBe('Final edit');
    useEditorStore.getState().undo();
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.props.text,
    ).toBe('Bienvenue dans DSK Visual Engine');
    useEditorStore.getState().redo();
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.props.text,
    ).toBe('Final edit');
  });

  it('rejects invalid properties without changing the document', () => {
    const before = useEditorStore.getState().document;
    expect(() => useEditorStore.getState().updateNodeProps('demo-heading', { level: 99 })).toThrow(
      'Invalid properties',
    );
    expect(useEditorStore.getState().document).toBe(before);
  });

  it('keeps viewport out of history and stores responsive style overrides in the document', () => {
    const store = useEditorStore.getState();
    store.setViewport('mobile');
    store.updateNodeStyles('demo-heading', 'mobile', { fontSize: '24px' });

    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.styles.mobile
        .fontSize,
    ).toBe('24px');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().viewport).toBe('mobile');
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.styles.mobile
        .fontSize,
    ).toBeUndefined();
  });

  it('adds a validated reusable section with fresh ids and selects its first node', () => {
    const preset = SECTION_PRESETS.find((item) => item.id === 'hero');
    expect(preset).toBeDefined();
    useEditorStore.getState().addSection(preset!);

    const state = useEditorStore.getState();
    const section = state.document.sections.at(-1);
    expect(section?.name).toBe('Hero');
    expect(state.selectedNodeId).toBe(section?.children[0]?.id);
    expect(validatePageDocument(state.document).success).toBe(true);

    const ids = state.document.sections.flatMap((item) => [item.id, ...getNodeIds(item.children)]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(section?.children[0]?.id).not.toBe(preset?.section.children[0]?.id);
  });

  it('moves a node to a section root without changing its id or losing the document structure', () => {
    const store = useEditorStore.getState();
    store.addSection(SECTION_PRESETS[1]!);
    const targetSection = useEditorStore.getState().document.sections.at(-1);
    expect(targetSection).toBeDefined();

    expect(useEditorStore.getState().moveNodeToSection('demo-button', targetSection!.id)).toBe(
      true,
    );
    const state = useEditorStore.getState();
    expect(
      state.document.sections[0]?.children[0]?.children.some((node) => node.id === 'demo-button'),
    ).toBe(false);
    expect(state.document.sections.at(-1)?.children.at(-1)?.id).toBe('demo-button');
    expect(validatePageDocument(state.document).success).toBe(true);
  });

  it('inserts dragged components at an explicit before, after, inside, or section-root position', () => {
    expect(useEditorStore.getState().addComponentAt('core/text', 'demo-grid', 'inside')).toBe(true);
    let state = useEditorStore.getState();
    const grid = state.document.sections[0]?.children[0]?.children.find(
      (node) => node.id === 'demo-grid',
    );
    expect(grid?.children.at(-1)?.type).toBe('core/text');
    expect(state.selectedNodeId).toBe(grid?.children.at(-1)?.id);

    expect(useEditorStore.getState().addComponentAt('core/button', 'demo-heading', 'before')).toBe(
      true,
    );
    state = useEditorStore.getState();
    expect(state.document.sections[0]?.children[0]?.children[0]?.type).toBe('core/button');
    expect(useEditorStore.getState().addComponentAt('core/text', 'demo-heading', 'inside')).toBe(
      false,
    );

    expect(useEditorStore.getState().addComponentToSection('core/divider', 'section-demo')).toBe(
      true,
    );
    state = useEditorStore.getState();
    expect(state.document.sections[0]?.children.at(-1)?.type).toBe('core/divider');
    expect(validatePageDocument(state.document).success).toBe(true);
  });

  it('reorders children within a Flex stack while preserving the original parent', () => {
    useEditorStore.getState().addSection(SECTION_PRESETS.find((item) => item.id === 'hero')!);
    const section = useEditorStore.getState().document.sections.at(-1)!;
    const container = section.children[0]!;
    const stack = container.children[0]!;
    const text = stack.children[1]!;
    const button = stack.children[2]!;

    expect(useEditorStore.getState().moveNode(text.id, button.id, 'after')).toBe(true);
    const updatedSection = useEditorStore.getState().document.sections.at(-1)!;
    const updatedStack = updatedSection.children[0]!.children[0]!;
    expect(updatedStack.children.map((node) => node.id)).toEqual([
      stack.children[0]!.id,
      button.id,
      text.id,
    ]);
  });

  it('keeps canvas zoom out of document history and clears responsive style overrides', () => {
    const store = useEditorStore.getState();
    store.updateNodeStyles('demo-heading', 'mobile', { fontSize: '24px' });
    const historyCount = useEditorStore.getState().pastDocuments.length;
    useEditorStore.getState().setZoom(0.8);
    expect(useEditorStore.getState().zoom).toBe(0.8);
    expect(useEditorStore.getState().pastDocuments).toHaveLength(historyCount);

    useEditorStore.getState().updateNodeStyles('demo-heading', 'mobile', { fontSize: '' });
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.styles.mobile
        .fontSize,
    ).toBeUndefined();
  });

  it('manages multiple pages: create, rename, duplicate, switch, and delete', () => {
    const store = useEditorStore.getState();
    const initialPageId = store.activePageId;
    expect(store.pages).toHaveLength(1);

    // 1. Create page
    const page2Id = store.createPage('Contact Page');
    let state = useEditorStore.getState();
    expect(state.pages).toHaveLength(2);
    expect(state.activePageId).toBe(page2Id);
    expect(state.document.metadata.title).toBe('Contact Page');

    // 2. Rename page
    expect(state.renamePage(page2Id, 'Contact Us')).toBe(true);
    state = useEditorStore.getState();
    expect(state.document.metadata.title).toBe('Contact Us');
    expect(state.pages.find((p) => p.id === page2Id)?.metadata.title).toBe('Contact Us');

    // 3. Switch back to initial page
    expect(state.switchPage(initialPageId)).toBe(true);
    state = useEditorStore.getState();
    expect(state.activePageId).toBe(initialPageId);
    expect(state.document.id).toBe(initialPageId);

    // 4. Duplicate page
    expect(state.duplicatePage(initialPageId)).toBe(true);
    state = useEditorStore.getState();
    expect(state.pages).toHaveLength(3);
    expect(state.document.metadata.title).toContain('(Copie)');

    // 5. Delete duplicated page
    const duplicatedId = state.activePageId;
    expect(state.deletePage(duplicatedId)).toBe(true);
    state = useEditorStore.getState();
    expect(state.pages).toHaveLength(2);
    expect(state.pages.some((p) => p.id === duplicatedId)).toBe(false);

    // 6. Cannot delete down to 0 pages
    expect(state.deletePage(state.pages[0]!.id)).toBe(true);
    state = useEditorStore.getState();
    expect(state.pages).toHaveLength(1);
    expect(state.deletePage(state.pages[0]!.id)).toBe(false);
  });

  it('creates and duplicates pages with unique IDs even across rapid successive operations', () => {
    const originalPage = useEditorStore.getState().pages[0]!;
    const createdIds = Array.from({ length: 5 }, (_, index) =>
      useEditorStore.getState().createPage(`Rapid page ${index}`),
    );

    const duplicatedIds: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      expect(useEditorStore.getState().duplicatePage(originalPage.id)).toBe(true);
      duplicatedIds.push(useEditorStore.getState().activePageId);
    }

    const state = useEditorStore.getState();
    const pageIds = state.pages.map((page) => page.id);
    expect(pageIds).toHaveLength(9);
    expect(new Set(pageIds).size).toBe(pageIds.length);
    expect(createdIds).toHaveLength(5);
    expect(new Set([...createdIds, ...duplicatedIds, originalPage.id]).size).toBe(9);
    expect(state.pages[0]).toBe(originalPage);
    expect(state.activePageId).toBe(duplicatedIds[2]);
    expect(state.document.id).toBe(state.activePageId);
    expect(state.selectedNodeId).toBeNull();
  });

  it('deletes only the requested page and preserves the active page and selection', () => {
    const originalPage = useEditorStore.getState().pages[0]!;
    const store = useEditorStore.getState();
    const activePageId = store.createPage('Active page');
    const inactivePageId = useEditorStore.getState().createPage('Inactive page');

    useEditorStore.getState().switchPage(activePageId);
    useEditorStore.getState().selectNode('demo-heading');
    const activeDocument = useEditorStore.getState().document;

    expect(useEditorStore.getState().deletePage(inactivePageId)).toBe(true);

    let state = useEditorStore.getState();
    expect(state.pages.map((page) => page.id)).toEqual([originalPage.id, activePageId]);
    expect(state.pages[0]).toBe(originalPage);
    expect(state.document).toBe(activeDocument);
    expect(state.activePageId).toBe(activePageId);
    expect(state.selectedNodeId).toBe('demo-heading');

    expect(state.deletePage(activePageId)).toBe(true);
    state = useEditorStore.getState();
    expect(state.pages).toEqual([originalPage]);
    expect(state.pages[0]).toBe(originalPage);
    expect(state.document).toBe(originalPage);
    expect(state.activePageId).toBe(originalPage.id);
    expect(state.selectedNodeId).toBeNull();
    expect(state.deletePage(activePageId)).toBe(false);
  });
});
