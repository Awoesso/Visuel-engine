import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { EditorConfiguration } from './config';
import type { EditorStore, EditorStoreApi } from './store';

const EditorStoreContext = createContext<EditorStoreApi | null>(null);
const EditorConfigurationContext = createContext<EditorConfiguration | null>(null);

export function EditorStoreProvider({
  store,
  children,
}: {
  store: EditorStoreApi;
  children: ReactNode;
}): ReactNode {
  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
}

export function EditorConfigurationProvider({
  configuration,
  children,
}: {
  configuration: EditorConfiguration;
  children: ReactNode;
}): ReactNode {
  return (
    <EditorConfigurationContext.Provider value={configuration}>
      {children}
    </EditorConfigurationContext.Provider>
  );
}

export function useEditorStoreApi(): EditorStoreApi {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error('Editor store context is missing. Wrap this component in EditorStoreProvider.');
  }
  return store;
}

export function useEditorStoreInstance<Selection>(
  selector: (state: EditorStore) => Selection,
): Selection {
  return useStore(useEditorStoreApi(), selector);
}

export function useEditorConfiguration(): EditorConfiguration {
  const configuration = useContext(EditorConfigurationContext);
  if (!configuration) {
    throw new Error(
      'Editor configuration context is missing. Wrap this component in EditorConfigurationProvider.',
    );
  }
  return configuration;
}
