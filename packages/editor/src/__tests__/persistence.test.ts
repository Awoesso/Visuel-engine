import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_SCHEMA_VERSION, PageDocumentSchema, registerMigration } from '@dsk/core';
import type { PageDocument } from '@dsk/core';
import { initialDocument, useEditorStore } from '../store';
import {
  AUTOSAVE_DEBOUNCE_MS,
  DocumentAutosave,
  EDITOR_STORAGE_KEY,
  restoreDocument,
  scheduleDocumentChange,
  type SaveState,
  type StorageLike,
} from '../persistence';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function editedDocument(): PageDocument {
  const document = PageDocumentSchema.parse(JSON.parse(JSON.stringify(initialDocument)));
  const container = document.sections[0]?.children[0];
  const heading = container?.children[0];
  if (!heading) throw new Error('Expected the demo heading to exist.');
  heading.props.text = 'Persisted heading';
  return document;
}

describe('editor document persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEditorStore.getState().resetDemo();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces autosave and restores the complete nested document and properties', () => {
    const storage = new MemoryStorage();
    const states: SaveState[] = [];
    const autosave = new DocumentAutosave(
      () => storage,
      (state) => states.push(state),
    );
    const document = editedDocument();

    autosave.schedule(document);
    expect(storage.getItem(EDITOR_STORAGE_KEY)).toBeNull();
    expect(states.at(-1)?.status).toBe('saving');

    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(storage.getItem(EDITOR_STORAGE_KEY)).toBeNull();
    vi.advanceTimersByTime(1);

    const restored = restoreDocument(() => storage);
    expect(restored.status).toBe('restored');
    if (restored.status === 'restored') {
      expect(restored.document.sections[0]?.children[0]?.children[0]?.props.text).toBe(
        'Persisted heading',
      );
      expect(restored.needsRewrite).toBe(false);
    }
    expect(states.at(-1)?.status).toBe('saved');
    expect(states.at(-1)?.lastSavedAt).not.toBeNull();
    autosave.dispose();
  });

  it('reports corrupt JSON and invalid documents without restoring them', () => {
    const storage = new MemoryStorage();
    storage.setItem(EDITOR_STORAGE_KEY, '{not json');
    expect(restoreDocument(() => storage).status).toBe('error');

    storage.setItem(
      EDITOR_STORAGE_KEY,
      JSON.stringify({
        formatVersion: 1,
        document: { id: '', schemaVersion: CURRENT_SCHEMA_VERSION, sections: [] },
      }),
    );
    const result = restoreDocument(() => storage);
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.error).toContain('id');
  });

  it('migrates a legacy document and marks it to be rewritten in the current format', () => {
    registerMigration({
      fromVersion: 0,
      toVersion: 1,
      migrate: (document) => ({ ...document, schemaVersion: 1 }),
    });
    const storage = new MemoryStorage();
    const legacy = JSON.parse(JSON.stringify(initialDocument)) as Record<string, unknown>;
    legacy.schemaVersion = 0;
    storage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(legacy));

    const result = restoreDocument(() => storage);
    expect(result.status).toBe('restored');
    if (result.status === 'restored') {
      expect(result.document.schemaVersion).toBe(1);
      expect(result.needsRewrite).toBe(true);
    }
  });

  it('reports unavailable and quota-exceeded storage errors', () => {
    const unavailable = () => {
      throw new Error('Storage unavailable');
    };
    const unavailableResult = restoreDocument(unavailable);
    expect(unavailableResult.status).toBe('error');
    if (unavailableResult.status === 'error') {
      expect(unavailableResult.error).toContain('Storage unavailable');
    }

    const quotaStorage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('Storage full', 'QuotaExceededError');
      },
    };
    const states: SaveState[] = [];
    const autosave = new DocumentAutosave(
      () => quotaStorage,
      (state) => states.push(state),
    );
    autosave.schedule(editedDocument());
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    expect(states.at(-1)?.status).toBe('error');
    expect(states.at(-1)?.error).toContain('Storage full');
    autosave.dispose();
  });

  it('does not autosave viewport changes and persists a reset to the demo document', () => {
    const storage = new MemoryStorage();
    const autosave = new DocumentAutosave(
      () => storage,
      () => undefined,
    );
    const unsubscribe = useEditorStore.subscribe((state, previousState) => {
      scheduleDocumentChange(state, previousState, autosave);
    });

    useEditorStore.getState().selectNode('demo-heading');
    useEditorStore.getState().setViewport('mobile');
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    expect(storage.getItem(EDITOR_STORAGE_KEY)).toBeNull();

    useEditorStore.getState().addComponent('core/heading');
    expect(useEditorStore.getState().selectedNodeId).toBeTruthy();
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    expect(storage.getItem(EDITOR_STORAGE_KEY)).not.toBeNull();

    useEditorStore.getState().resetDemo();
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    const restored = restoreDocument(() => storage);
    expect(restored.status).toBe('restored');
    if (restored.status === 'restored') {
      expect(restored.document.sections[0]?.children).toHaveLength(1);
      expect(restored.document.sections[0]?.children.at(-1)?.type).toBe('core/container');
    }

    unsubscribe();
    autosave.dispose();
  });

  it('selects empty Text and Grid nodes immediately after insertion', () => {
    const store = useEditorStore.getState();
    store.resetDemo();

    store.addComponent('core/text');
    let current = useEditorStore.getState();
    let inserted = current.document.sections[0]?.children.at(-1);
    expect(inserted?.type).toBe('core/text');
    expect(inserted?.props.content).toBe('');
    expect(current.selectedNodeId).toBe(inserted?.id);

    current.addComponent('core/grid');
    current = useEditorStore.getState();
    inserted = current.document.sections[0]?.children.at(-1);
    expect(inserted?.type).toBe('core/grid');
    expect(inserted?.children).toHaveLength(0);
    expect(current.selectedNodeId).toBe(inserted?.id);
  });
});
