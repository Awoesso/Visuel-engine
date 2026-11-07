import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { FillEditor } from '../components/ui/FillEditor';
import { SpacingBox } from '../components/ui/SpacingBox';
import { PropertyPanel } from '../components/PropertyPanel';
import { ComponentSidebar, getNodeIcon } from '../components/ComponentSidebar';
import { useEditorStore } from '../store';

describe('Phase 2 — Figma UI & Filling System', () => {
  beforeEach(() => {
    useEditorStore.getState().resetDemo();
  });
  it('renders FillEditor with solid color swatch and hex representation', () => {
    const markup = renderToStaticMarkup(
      <FillEditor
        styles={{ backgroundColor: '#0d99ff', opacity: 0.8 }}
        onChange={() => {}}
      />
    );
    expect(markup).toContain('Fill');
    expect(markup).toContain('0D99FF');
    expect(markup).toContain('80');
    expect(markup).toContain('%');
  });

  it('renders FillEditor with gradient or image label', () => {
    const gradientMarkup = renderToStaticMarkup(
      <FillEditor
        styles={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
        onChange={() => {}}
      />
    );
    expect(gradientMarkup).toContain('Dégradé');

    const imageMarkup = renderToStaticMarkup(
      <FillEditor
        styles={{ backgroundImage: 'url("https://example.com/test.jpg")', backgroundSize: 'cover' }}
        onChange={() => {}}
      />
    );
    expect(imageMarkup).toContain('Image');
  });

  it('renders SpacingBox with linked 4-side spacing inputs', () => {
    const markup = renderToStaticMarkup(
      <SpacingBox
        label="Padding"
        top="16px"
        right="16px"
        bottom="16px"
        left="16px"
        onChange={() => {}}
      />
    );
    expect(markup).toContain('Padding');
    expect(markup).toContain('16');
  });

  it('returns appropriate contextual icon for each layer type', () => {
    const headingIcon = getNodeIcon('core/heading');
    const buttonIcon = getNodeIcon('core/button');
    const imageIcon = getNodeIcon('core/image');
    const containerIcon = getNodeIcon('core/container');
    const gridIcon = getNodeIcon('core/grid');
    const sectionIcon = getNodeIcon('section');

    expect(headingIcon).toBeDefined();
    expect(buttonIcon).toBeDefined();
    expect(imageIcon).toBeDefined();
    expect(containerIcon).toBeDefined();
    expect(gridIcon).toBeDefined();
    expect(sectionIcon).toBeDefined();
  });

  it('renders ComponentSidebar with Pages section and Layers tree', () => {
    const markup = renderToStaticMarkup(
      <ComponentSidebar />
    );
    expect(markup).toContain('Pages');
    expect(markup).toContain('Layers');
    expect(markup).toContain('Components');
  });

  it('renders PropertyPanel in empty state when no element is selected', () => {
    useEditorStore.getState().selectNode(null);
    const markup = renderToStaticMarkup(
      <PropertyPanel />
    );
    expect(markup).toContain('Design');
    expect(markup).toContain('Prototype');
    expect(markup).toContain('Aucun élément sélectionné');
  });

  it('renders PropertyPanel with contextual sections when an element is selected', () => {
    const markup = renderToStaticMarkup(
      <PropertyPanel selectedNodeId="demo-container" />
    );
    expect(markup).toContain('Position');
    expect(markup).toContain('Appearance');
    expect(markup).toContain('Fill');
    expect(markup).toContain('Stroke');
  });
});
