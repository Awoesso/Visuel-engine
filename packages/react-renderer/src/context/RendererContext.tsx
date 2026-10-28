import { createContext } from 'react';
import type { RendererContextValue } from '../types';

export const RendererContext = createContext<RendererContextValue | null>(null);
