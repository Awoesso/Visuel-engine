import React from 'react';
import { useEditorStore, type ViewportMode } from '../../store';

export const ViewportSelector: React.FC = () => {
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);

  const options: { id: ViewportMode; label: string }[] = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'mobile', label: 'Mobile' },
  ];

  return (
    <div className="viewport-selector" role="group" aria-label="Sélecteur de viewport">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`viewport-btn ${viewport === option.id ? 'active' : ''}`}
          onClick={() => setViewport(option.id)}
          aria-pressed={viewport === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
