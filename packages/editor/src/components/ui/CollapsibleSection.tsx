import React, { useState, PropsWithChildren } from 'react';
import { Tooltip } from '@geist-ui/core';

export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  description?: string;
}

export const CollapsibleSection: React.FC<PropsWithChildren<CollapsibleSectionProps>> = ({
  title,
  defaultOpen = true,
  description,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="property-section">
      <header
        className="section-header"
        onClick={() => setOpen(!open)}
        title={description}
        role="button"
        aria-expanded={open}
      >
        <strong>{title}</strong>
        <span>{open ? '▾' : '▸'}</span>
      </header>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
};
