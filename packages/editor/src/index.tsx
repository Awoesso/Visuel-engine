import React, { useEffect, useRef, useState } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { ComponentSidebar } from './components/ComponentSidebar';
import { PropertyPanel } from './components/PropertyPanel';
import { useEditorStore } from './store';
import { DocumentAutosave, restoreDocument, scheduleDocumentChange } from './persistence';
import './components/styles.css';

export const EditorApp: React.FC = () => {
  const autosaveRef = useRef<DocumentAutosave | null>(null);
  const document = useEditorStore((state) => state.document);
  const viewport = useEditorStore((state) => state.viewport);
  const saveState = useEditorStore((state) => state.saveState);
  const setViewport = useEditorStore((state) => state.setViewport);
  const setSaveState = useEditorStore((state) => state.setSaveState);
  const resetDemo = useEditorStore((state) => state.resetDemo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.pastDocuments.length > 0);
  const canRedo = useEditorStore((state) => state.futureDocuments.length > 0);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const autosave = new DocumentAutosave(() => window.localStorage, setSaveState);
    autosaveRef.current = autosave;
    const restored = restoreDocument(() => window.localStorage);

    if (restored.status === 'restored') {
      useEditorStore.getState().replaceDocument(restored.document);
      autosave.setLastSavedAt(restored.lastSavedAt);
      if (restored.needsRewrite) {
        autosave.saveNow(restored.document);
      } else {
        setSaveState({
          status: 'saved',
          lastSavedAt: restored.lastSavedAt,
          error: null,
        });
      }
    } else if (restored.status === 'error') {
      setSaveState({ status: 'error', lastSavedAt: null, error: restored.error });
    } else {
      setSaveState({ status: 'idle', lastSavedAt: null, error: null });
    }

    const unsubscribe = useEditorStore.subscribe((state, previousState) => {
      scheduleDocumentChange(state, previousState, autosave);
    });
    const flushPendingSave = () => {
      autosave.flushIfPending(useEditorStore.getState().document);
    };
    window.addEventListener('pagehide', flushPendingSave);

    return () => {
      window.removeEventListener('pagehide', flushPendingSave);
      unsubscribe();
      autosave.dispose();
      autosaveRef.current = null;
    };
  }, [setSaveState]);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [redo, undo]);

  const saveStatusLabel = {
    idle: 'Not saved',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error',
  }[saveState.status];

  const lastSavedLabel =
    saveState.lastSavedAt === null
      ? null
      : new Date(saveState.lastSavedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

  return (
    <div className={`editor-root${previewMode ? ' preview-mode' : ''}`}>
      <header className="editor-toolbar">
        <div className="editor-brand">
          <span className="editor-brand-mark" aria-hidden="true">D</span>
          <div>
            <h1>DSK Visual Engine</h1>
            <p>Éditeur de page</p>
          </div>
        </div>
        <div className="editor-document">
          <span className="document-label">Document</span>
          <strong title={document.metadata.title}>{document.metadata.title}</strong>
        </div>
        <div className="editor-toolbar-actions">
          <div className="history-actions" role="group" aria-label="Historique du document">
            <button
              className="toolbar-button"
              type="button"
              aria-label="Annuler"
              title="Annuler (Ctrl/Cmd+Z)"
              disabled={!canUndo}
              onClick={undo}
            >
              ↶
            </button>
            <button
              className="toolbar-button"
              type="button"
              aria-label="Rétablir"
              title="Rétablir (Ctrl/Cmd+Shift+Z)"
              disabled={!canRedo}
              onClick={redo}
            >
              ↷
            </button>
          </div>
          <div className="save-indicator" role="status" aria-live="polite" data-status={saveState.status}>
            <span className="save-indicator-dot" aria-hidden="true" />
            <span title={saveState.error ?? undefined}>{saveStatusLabel}</span>
            {lastSavedLabel ? <time dateTime={saveState.lastSavedAt ?? undefined}>à {lastSavedLabel}</time> : null}
          </div>
          <button
            className="toolbar-button toolbar-button-primary"
            type="button"
            onClick={() => {
              autosaveRef.current?.saveNow(useEditorStore.getState().document);
            }}
          >
            Save
          </button>
          <button
            className={`toolbar-button${previewMode ? ' toolbar-button-primary' : ''}`}
            type="button"
            aria-pressed={previewMode}
            onClick={() => setPreviewMode((current) => !current)}
          >
            {previewMode ? 'Exit preview' : 'Preview'}
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => {
              if (window.confirm('Réinitialiser la démo et perdre les modifications actuelles ?')) {
                resetDemo();
              }
            }}
          >
            Reset demo
          </button>
          <div className="viewport-switcher" role="group" aria-label="Aperçu responsive">
            {([
              ['desktop', 'Desktop'],
              ['tablet', 'Tablet'],
              ['mobile', 'Mobile'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewport === mode}
                onClick={() => setViewport(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="editor-workspace">
        <ComponentSidebar />
        <EditorCanvas preview={previewMode} />
        <PropertyPanel />
      </div>
    </div>
  );
};

export { initialDocument, useEditorStore } from './store';
export {
  AUTOSAVE_DEBOUNCE_MS,
  DocumentAutosave,
  EDITOR_STORAGE_KEY,
  restoreDocument,
  saveDocument,
} from './persistence';
export type { RestoreResult, SaveState, SaveStatus, StorageLike, StorageProvider } from './persistence';
