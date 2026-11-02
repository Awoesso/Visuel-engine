import { SectionNodeSchema } from '@dsk/core';
import type { SectionNode } from '@dsk/core';

export interface SectionPreset {
  id: string;
  name: string;
  description: string;
  section: SectionNode;
}

const hero = SectionNodeSchema.parse({
  id: 'preset-hero',
  name: 'Hero',
  styles: {
    desktop: { backgroundColor: '#f5f7ff', paddingTop: '80px', paddingBottom: '80px' },
    tablet: { paddingTop: '64px', paddingBottom: '64px' },
    mobile: { paddingTop: '40px', paddingBottom: '40px' },
  },
  children: [
    {
      id: 'preset-hero-container',
      type: 'core/container',
      props: { maxWidth: 'lg', alignment: 'center', padding: 'lg' },
      children: [
        {
          id: 'preset-hero-stack',
          type: 'core/stack',
          props: { direction: 'column', gap: 'md', alignItems: 'center' },
          children: [
            {
              id: 'preset-hero-heading',
              type: 'core/heading',
              props: { text: 'Make your next idea happen', level: 1, textAlign: 'center' },
              styles: {
                desktop: { maxWidth: '760px', fontSize: '56px', lineHeight: '1.1' },
                mobile: { fontSize: '38px' },
              },
            },
            {
              id: 'preset-hero-text',
              type: 'core/text',
              props: {
                content: 'A clear, confident introduction to your product or service.',
                textAlign: 'center',
              },
              styles: { desktop: { maxWidth: '620px', fontSize: '18px', color: '#596579' } },
            },
            {
              id: 'preset-hero-cta',
              type: 'core/button',
              props: { label: 'Get started', variant: 'primary', size: 'lg' },
            },
          ],
        },
      ],
    },
  ],
});

const featureGrid = SectionNodeSchema.parse({
  id: 'preset-features',
  name: 'Feature grid',
  styles: { desktop: { paddingTop: '64px', paddingBottom: '64px' } },
  children: [
    {
      id: 'preset-features-container',
      type: 'core/container',
      props: { maxWidth: 'xl', padding: 'lg' },
      children: [
        {
          id: 'preset-features-heading',
          type: 'core/heading',
          props: { text: 'Everything you need to move forward', level: 2, textAlign: 'center' },
          styles: { desktop: { marginBottom: '32px' } },
        },
        {
          id: 'preset-features-grid',
          type: 'core/grid',
          props: { columns: 3, gap: 'lg' },
          styles: {
            desktop: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
            tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
            mobile: { gridTemplateColumns: 'minmax(0, 1fr)' },
          },
          children: ['Clarity', 'Flexibility', 'Momentum'].map((title, index) => ({
            id: `preset-feature-card-${index + 1}`,
            type: 'core/container',
            props: { padding: 'lg', backgroundColor: '#f8fafc' },
            styles: { desktop: { borderRadius: '12px', minHeight: '156px' } },
            children: [
              {
                id: `preset-feature-title-${index + 1}`,
                type: 'core/heading',
                props: { text: title, level: 3 },
              },
              {
                id: `preset-feature-copy-${index + 1}`,
                type: 'core/text',
                props: { content: 'A thoughtful foundation that adapts as your work grows.' },
                styles: { desktop: { color: '#596579' } },
              },
            ],
          })),
        },
      ],
    },
  ],
});

const callToAction = SectionNodeSchema.parse({
  id: 'preset-cta',
  name: 'Call to action',
  styles: {
    desktop: { backgroundColor: '#172554', paddingTop: '56px', paddingBottom: '56px' },
    mobile: { paddingTop: '36px', paddingBottom: '36px' },
  },
  children: [
    {
      id: 'preset-cta-container',
      type: 'core/container',
      props: { maxWidth: 'lg', padding: 'lg' },
      children: [
        {
          id: 'preset-cta-stack',
          type: 'core/stack',
          props: { direction: 'column', gap: 'md', alignItems: 'center' },
          children: [
            {
              id: 'preset-cta-heading',
              type: 'core/heading',
              props: { text: 'Ready to get started?', level: 2, textAlign: 'center' },
              styles: { desktop: { color: '#ffffff' } },
            },
            {
              id: 'preset-cta-text',
              type: 'core/text',
              props: {
                content: 'Take the next step with a team that is ready to help.',
                textAlign: 'center',
              },
              styles: { desktop: { color: '#dbeafe' } },
            },
            {
              id: 'preset-cta-button',
              type: 'core/button',
              props: { label: 'Talk to our team', variant: 'primary', size: 'lg' },
            },
          ],
        },
      ],
    },
  ],
});

export const SECTION_PRESETS: readonly SectionPreset[] = [
  {
    id: 'hero',
    name: 'Hero',
    description: 'Introduction, proposition de valeur et appel à l’action.',
    section: hero,
  },
  {
    id: 'feature-grid',
    name: 'Feature grid',
    description: 'Trois cartes de contenu avec une grille responsive.',
    section: featureGrid,
  },
  {
    id: 'call-to-action',
    name: 'Call to action',
    description: 'Bandeau de conversion avec titre et bouton.',
    section: callToAction,
  },
];
