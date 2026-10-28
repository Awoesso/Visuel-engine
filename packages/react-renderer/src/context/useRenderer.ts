import { useContext } from 'react';
import { RendererContext } from './RendererContext';
import type { RendererContextValue } from '../types';

export function useRenderer(): RendererContextValue {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRenderer must be used within a PageRenderer or RendererContext.Provider');
  }
  return context;
}
