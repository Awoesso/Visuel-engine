import { migrateAndValidateDocument, validatePageDocument } from '@dsk/core';
import type { PageDocument } from '@dsk/core';

export const EDITOR_STORAGE_KEY = 'dsk-visual-engine:document';
export const AUTOSAVE_DEBOUNCE_MS = 500;
const STORAGE_FORMAT_VERSION = 1;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveState {
  status: SaveStatus;
  lastSavedAt: string | null;
  error: string | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type StorageProvider = () => StorageLike;

export type RestoreResult =
  | { status: 'empty' }
  | {
      status: 'restored';
      document: PageDocument;
      lastSavedAt: string | null;
      needsRewrite: boolean;
    }
  | { status: 'error'; error: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function restoreDocument(storageProvider: StorageProvider): RestoreResult {
  try {
    const stored = storageProvider().getItem(EDITOR_STORAGE_KEY);
    if (stored === null) return { status: 'empty' };

    const parsed: unknown = JSON.parse(stored);
    let rawDocument = parsed;
    let lastSavedAt: string | null = null;
    let hasCurrentEnvelope = false;

    if (parsed && typeof parsed === 'object' && 'formatVersion' in parsed) {
      const envelope = parsed as Record<string, unknown>;
      if (envelope.formatVersion !== STORAGE_FORMAT_VERSION) {
        return {
          status: 'error',
          error: `Unsupported saved document format version: ${String(envelope.formatVersion)}`,
        };
      }
      rawDocument = envelope.document;
      hasCurrentEnvelope = true;
      lastSavedAt =
        typeof envelope.savedAt === 'string' && Number.isFinite(Date.parse(envelope.savedAt))
          ? envelope.savedAt
          : null;
    }

    const result = migrateAndValidateDocument(rawDocument);
    if (!result.success) {
      return {
        status: 'error',
        error: result.errors.map(({ path, message }) => `${path}: ${message}`).join('; '),
      };
    }

    return {
      status: 'restored',
      document: result.data,
      lastSavedAt,
      needsRewrite: result.migrated || !hasCurrentEnvelope,
    };
  } catch (error) {
    return { status: 'error', error: errorMessage(error) };
  }
}

export function saveDocument(
  storageProvider: StorageProvider,
  document: PageDocument,
  now: () => Date = () => new Date(),
): string {
  const validation = validatePageDocument(document);
  if (!validation.success) {
    throw new Error(validation.errors.map(({ path, message }) => `${path}: ${message}`).join('; '));
  }

  const savedAt = now().toISOString();
  const serialized = JSON.stringify({
    formatVersion: STORAGE_FORMAT_VERSION,
    savedAt,
    document,
  });
  storageProvider().setItem(EDITOR_STORAGE_KEY, serialized);
  return savedAt;
}

export class DocumentAutosave {
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly storageProvider: StorageProvider,
    private readonly onStateChange: (state: SaveState) => void,
    private readonly debounceMs = AUTOSAVE_DEBOUNCE_MS,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private lastSavedAt: string | null = null;

  setLastSavedAt(lastSavedAt: string | null): void {
    this.lastSavedAt = lastSavedAt;
  }

  schedule(document: PageDocument): void {
    this.clearTimer();
    this.onStateChange({ status: 'saving', lastSavedAt: this.lastSavedAt, error: null });
    this.timeout = setTimeout(() => this.write(document), this.debounceMs);
  }

  saveNow(document: PageDocument): void {
    this.clearTimer();
    this.onStateChange({ status: 'saving', lastSavedAt: this.lastSavedAt, error: null });
    this.write(document);
  }

  flushIfPending(document: PageDocument): void {
    if (this.timeout !== null) {
      this.saveNow(document);
    }
  }

  dispose(): void {
    this.clearTimer();
  }

  private write(document: PageDocument): void {
    this.timeout = null;
    try {
      const savedAt = saveDocument(this.storageProvider, document, this.now);
      this.lastSavedAt = savedAt;
      this.onStateChange({ status: 'saved', lastSavedAt: savedAt, error: null });
    } catch (error) {
      this.onStateChange({
        status: 'error',
        lastSavedAt: this.lastSavedAt,
        error: errorMessage(error),
      });
    }
  }

  private clearTimer(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export function scheduleDocumentChange(
  state: { document: PageDocument },
  previousState: { document: PageDocument },
  autosave: Pick<DocumentAutosave, 'schedule'>,
): void {
  if (state.document !== previousState.document) {
    autosave.schedule(state.document);
  }
}
