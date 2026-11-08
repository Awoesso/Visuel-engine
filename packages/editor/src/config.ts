import { ThemeTokensSchema } from '@dsk/core';
import type { ComponentRegistry, PageDocument, ThemeTokens } from '@dsk/core';
import type { ComponentMapping } from '@dsk/react-renderer';
import type { EditorStoreApi } from './store';

export interface EditorRegistry {
  definitions: ComponentRegistry;
  renderers: ComponentMapping;
}

export interface EditorOptions {
  /** Show the layers, pages, and component sidebar. Defaults to true. */
  showSidebar?: boolean;
  /** Show the selected-component inspector. Defaults to true. */
  showInspector?: boolean;
  /** Show the existing manual-save action. Defaults to true. */
  showSaveButton?: boolean;
  /** Show the existing preview-mode action. Defaults to true. */
  showPreviewButton?: boolean;
}

export type EditorTheme = {
  name?: string;
  colors?: Partial<ThemeTokens['colors']>;
  typography?: Partial<ThemeTokens['typography']>;
  spacing?: Partial<ThemeTokens['spacing']>;
  borderRadius?: Partial<ThemeTokens['borderRadius']>;
  shadows?: Partial<ThemeTokens['shadows']>;
  containerWidth?: Partial<ThemeTokens['containerWidth']>;
};

export interface EditorCallbacks {
  /** Called when the active page document changes. */
  onChange?: (document: PageDocument) => void;
  /** Called when the selected node changes. */
  onSelectionChange?: (nodeId: string | null) => void;
  /** Called after an editor save succeeds. */
  onSave?: (document: PageDocument, savedAt: string) => void;
}

export interface EditorConfiguration {
  registry: EditorRegistry;
  theme: EditorTheme | undefined;
  options: Required<EditorOptions>;
  callbacks: EditorCallbacks;
}

export const DEFAULT_EDITOR_OPTIONS: Required<EditorOptions> = {
  showSidebar: true,
  showInspector: true,
  showSaveButton: true,
  showPreviewButton: true,
};

export function resolveEditorTheme(
  documentTheme: ThemeTokens,
  override?: EditorTheme,
): ThemeTokens {
  return ThemeTokensSchema.parse({
    ...documentTheme,
    ...override,
    colors: { ...documentTheme.colors, ...override?.colors },
    typography: {
      ...documentTheme.typography,
      ...override?.typography,
      fontFamily: "'Geist', Arial, sans-serif",
      headingFontFamily: "'Geist', Arial, sans-serif",
    },
    spacing: { ...documentTheme.spacing, ...override?.spacing },
    borderRadius: { ...documentTheme.borderRadius, ...override?.borderRadius },
    shadows: { ...documentTheme.shadows, ...override?.shadows },
    containerWidth: { ...documentTheme.containerWidth, ...override?.containerWidth },
  });
}

export interface EditorAppProps {
  /** Seeds an internally created store on the first mount; it is not a controlled prop. */
  initialDocument?: PageDocument;
  /** Definitions drive editing; renderers drive canvas output. */
  registry?: EditorRegistry;
  /** Overrides the theme from the active document for the editor and its canvas. */
  theme?: EditorTheme;
  options?: EditorOptions;
  callbacks?: EditorCallbacks;
  /** When supplied, this store owns the document and takes precedence over initialDocument. */
  store?: EditorStoreApi;
}
