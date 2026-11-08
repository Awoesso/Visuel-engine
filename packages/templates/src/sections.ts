import { ComponentNodeSchema, SectionNodeSchema } from '@dsk/core';
import type { ComponentNode, ResponsiveStyles, SectionNode } from '@dsk/core';

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

function node(
  id: string,
  type: string,
  props: Record<string, unknown> = {},
  children: ComponentNode[] = [],
  styles?: Partial<ResponsiveStyles>,
): ComponentNode {
  return ComponentNodeSchema.parse({ id, type, props, children, styles });
}

function section(
  id: string,
  name: string,
  styles: ResponsiveStyles,
  children: ComponentNode[],
): SectionNode {
  return SectionNodeSchema.parse({ id, name, styles, children });
}

const header = section(
  'preset-header',
  'En-tête',
  {
    desktop: { backgroundColor: '#ffffff', paddingTop: '14px', paddingBottom: '14px' },
    tablet: { paddingTop: '12px', paddingBottom: '12px' },
    mobile: { paddingTop: '12px', paddingBottom: '12px' },
  },
  [
    node('preset-header-container', 'core/container', { maxWidth: 'xl', padding: 'md' }, [
      node(
        'preset-header-layout',
        'core/stack',
        { direction: 'row', gap: 'lg', alignItems: 'center', justifyContent: 'space-between' },
        [
          node('preset-header-brand', 'core/heading', { text: 'Votre marque', level: 3 }, [], {
            desktop: { marginBottom: '0' },
          }),
          node(
            'preset-header-links',
            'core/stack',
            { direction: 'row', gap: 'md', alignItems: 'center', wrap: true },
            [
              node('preset-header-link-1', 'core/text', { content: 'Accueil' }),
              node('preset-header-link-2', 'core/text', { content: 'Boutique' }),
              node('preset-header-link-3', 'core/text', { content: 'À propos' }),
            ],
            {
              desktop: {},
              tablet: { flexWrap: 'wrap', justifyContent: 'center' },
              mobile: {
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
              },
            },
          ),
          node('preset-header-cta', 'core/button', {
            label: 'Nous contacter',
            url: '#contact',
            variant: 'outline',
            size: 'sm',
          }),
        ],
        {
          desktop: {},
          tablet: { flexWrap: 'wrap', justifyContent: 'center', gap: '16px' },
          mobile: {
            flexDirection: 'column',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '14px',
          },
        },
      ),
    ]),
  ],
);

const heroEditorial = section(
  'preset-hero-editorial',
  'Hero avec visuel',
  {
    desktop: {
      backgroundColor: '#f5f3ff',
      paddingTop: '72px',
      paddingBottom: '72px',
    },
    tablet: { paddingTop: '52px', paddingBottom: '52px' },
    mobile: { paddingTop: '36px', paddingBottom: '36px' },
  },
  [
    node('preset-hero-editorial-container', 'core/container', { maxWidth: 'xl', padding: 'lg' }, [
      node(
        'preset-hero-editorial-grid',
        'core/grid',
        { columns: 2, gap: 'xl', alignItems: 'center' },
        [
          node(
            'preset-hero-editorial-copy',
            'core/stack',
            { direction: 'column', gap: 'md' },
            [
              node(
                'preset-hero-editorial-eyebrow',
                'core/text',
                {
                  content: 'NOUVELLE COLLECTION',
                },
                [],
                {
                  desktop: {
                    color: '#6d28d9',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '1.4px',
                  },
                },
              ),
              node(
                'preset-hero-editorial-heading',
                'core/heading',
                {
                  text: 'Des essentiels qui vous ressemblent.',
                  level: 1,
                  textAlign: 'left',
                },
                [],
                {
                  desktop: { fontSize: '54px', lineHeight: '1.08' },
                  tablet: { fontSize: '44px' },
                  mobile: { fontSize: '36px', textAlign: 'center' },
                },
              ),
              node(
                'preset-hero-editorial-description',
                'core/text',
                {
                  content:
                    'Découvrez une sélection pensée pour accompagner votre quotidien, avec style et simplicité.',
                },
                [],
                {
                  desktop: { color: '#52525b', fontSize: '18px', maxWidth: '520px' },
                  mobile: { textAlign: 'center' },
                },
              ),
              node(
                'preset-hero-editorial-button',
                'core/button',
                {
                  label: 'Découvrir la collection',
                  url: '#collection',
                  variant: 'primary',
                  size: 'lg',
                },
                [],
                {
                  mobile: { width: '100%' },
                },
              ),
            ],
            {
              desktop: {},
              mobile: { alignItems: 'center', textAlign: 'center' },
            },
          ),
          node(
            'preset-hero-editorial-art',
            'core/container',
            { maxWidth: 'none', padding: 'xl', backgroundColor: '#ddd6fe' },
            [
              node('preset-hero-art-label', 'core/heading', {
                text: 'La sélection du moment',
                level: 3,
                textAlign: 'center',
              }),
              node('preset-hero-art-grid', 'core/grid', { columns: 2, gap: 'md' }, [
                node(
                  'preset-hero-art-card-1',
                  'core/container',
                  {
                    padding: 'lg',
                    backgroundColor: '#ffffff',
                  },
                  [
                    node('preset-hero-art-product-1', 'core/heading', {
                      text: 'Objet signature',
                      level: 4,
                    }),
                    node('preset-hero-art-price-1', 'core/text', { content: 'À partir de 39 €' }),
                  ],
                  {
                    desktop: { borderRadius: '16px', minHeight: '120px' },
                  },
                ),
                node(
                  'preset-hero-art-card-2',
                  'core/container',
                  {
                    padding: 'lg',
                    backgroundColor: '#ede9fe',
                  },
                  [
                    node('preset-hero-art-product-2', 'core/heading', {
                      text: 'Édition limitée',
                      level: 4,
                    }),
                    node('preset-hero-art-price-2', 'core/text', { content: 'Une pièce unique' }),
                  ],
                  {
                    desktop: { borderRadius: '16px', minHeight: '120px' },
                  },
                ),
              ]),
            ],
            {
              desktop: { borderRadius: '24px', boxShadow: '0 24px 60px #4c1d9530' },
              mobile: {
                paddingTop: '20px',
                paddingRight: '20px',
                paddingBottom: '20px',
                paddingLeft: '20px',
                borderRadius: '18px',
              },
            },
          ),
        ],
        {
          desktop: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
          tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' },
          mobile: { gridTemplateColumns: 'minmax(0, 1fr)', gap: '28px' },
        },
      ),
    ]),
  ],
);

const productCollection = section(
  'preset-product-collection',
  'Sélection de produits',
  {
    desktop: { paddingTop: '64px', paddingBottom: '64px' },
    tablet: { paddingTop: '48px', paddingBottom: '48px' },
    mobile: { paddingTop: '36px', paddingBottom: '36px' },
  },
  [
    node('preset-product-container', 'core/container', { maxWidth: 'xl', padding: 'lg' }, [
      node(
        'preset-product-heading',
        'core/heading',
        {
          text: 'Nos coups de cœur',
          level: 2,
          textAlign: 'center',
        },
        [],
        {
          desktop: { marginBottom: '8px' },
        },
      ),
      node(
        'preset-product-intro',
        'core/text',
        {
          content: 'Une sélection de pièces choisies pour vous.',
          textAlign: 'center',
        },
        [],
        {
          desktop: { color: '#71717a', marginBottom: '28px' },
          mobile: { marginBottom: '20px' },
        },
      ),
      node(
        'preset-product-grid',
        'core/grid',
        { columns: 3, gap: 'lg' },
        ['L’essentiel', 'Le favori', 'La nouveauté'].map((title, index) =>
          node(
            `preset-product-card-${index + 1}`,
            'core/container',
            { maxWidth: 'none', padding: 'md', backgroundColor: '#f4f4f5' },
            [
              node(
                `preset-product-art-${index + 1}`,
                'core/container',
                {
                  maxWidth: 'none',
                  padding: 'xl',
                  backgroundColor: ['#e0e7ff', '#fce7f3', '#dcfce7'][index],
                },
                [
                  node(
                    `preset-product-art-label-${index + 1}`,
                    'core/text',
                    {
                      content: 'Votre visuel produit',
                      textAlign: 'center',
                    },
                    [],
                    {
                      desktop: { color: '#52525b', fontSize: '13px' },
                    },
                  ),
                ],
                {
                  desktop: { borderRadius: '12px', minHeight: '150px' },
                  mobile: { minHeight: '120px' },
                },
              ),
              node(
                `preset-product-title-${index + 1}`,
                'core/heading',
                {
                  text: title,
                  level: 3,
                },
                [],
                {
                  desktop: { marginTop: '16px', marginBottom: '4px' },
                },
              ),
              node(
                `preset-product-price-${index + 1}`,
                'core/text',
                {
                  content: 'À partir de 29 €',
                },
                [],
                {
                  desktop: { color: '#52525b' },
                },
              ),
            ],
            {
              desktop: { borderRadius: '16px' },
            },
          ),
        ),
        {
          desktop: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
          tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' },
          mobile: { gridTemplateColumns: 'minmax(0, 1fr)', gap: '14px' },
        },
      ),
    ]),
  ],
);

const testimonials = section(
  'preset-testimonials',
  'Témoignages',
  {
    desktop: { backgroundColor: '#f8fafc', paddingTop: '64px', paddingBottom: '64px' },
    tablet: { paddingTop: '48px', paddingBottom: '48px' },
    mobile: { paddingTop: '36px', paddingBottom: '36px' },
  },
  [
    node('preset-testimonials-container', 'core/container', { maxWidth: 'xl', padding: 'lg' }, [
      node(
        'preset-testimonials-heading',
        'core/heading',
        {
          text: 'Ils en parlent mieux que nous',
          level: 2,
          textAlign: 'center',
        },
        [],
        {
          desktop: { marginBottom: '28px' },
          mobile: { marginBottom: '20px' },
        },
      ),
      node(
        'preset-testimonials-grid',
        'core/grid',
        { columns: 3, gap: 'lg' },
        [
          ['Simple et beau', 'Une expérience fluide du début à la fin.', 'Camille R.'],
          ['Un vrai coup de cœur', 'La qualité est au rendez-vous, je recommande.', 'Alex M.'],
          ['Service impeccable', 'Une équipe disponible et une livraison rapide.', 'Sam D.'],
        ].map(([title, quote, author], index) =>
          node(
            `preset-testimonial-card-${index + 1}`,
            'core/container',
            { maxWidth: 'none', padding: 'lg', backgroundColor: '#ffffff' },
            [
              node(`preset-testimonial-title-${index + 1}`, 'core/heading', {
                text: title!,
                level: 3,
              }),
              node(
                `preset-testimonial-quote-${index + 1}`,
                'core/text',
                {
                  content: `« ${quote} »`,
                },
                [],
                {
                  desktop: { color: '#52525b', lineHeight: '1.7' },
                },
              ),
              node(
                `preset-testimonial-author-${index + 1}`,
                'core/text',
                {
                  content: author!,
                },
                [],
                {
                  desktop: { marginTop: '12px', fontWeight: '700' },
                },
              ),
            ],
            {
              desktop: { borderRadius: '16px', boxShadow: '0 8px 24px #0f172a0a' },
            },
          ),
        ),
        {
          desktop: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
          tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
          mobile: { gridTemplateColumns: 'minmax(0, 1fr)' },
        },
      ),
    ]),
  ],
);

const faq = section(
  'preset-faq',
  'FAQ - Questions fréquentes',
  {
    desktop: { paddingTop: '64px', paddingBottom: '64px' },
    tablet: { paddingTop: '48px', paddingBottom: '48px' },
    mobile: { paddingTop: '36px', paddingBottom: '36px' },
  },
  [
    node('preset-faq-container', 'core/container', { maxWidth: 'lg', padding: 'lg' }, [
      node(
        'preset-faq-heading',
        'core/heading',
        {
          text: 'Questions fréquentes',
          level: 2,
          textAlign: 'center',
        },
        [],
        {
          desktop: { marginBottom: '10px' },
        },
      ),
      node(
        'preset-faq-intro',
        'core/text',
        {
          content: 'Tout ce que vous souhaitez savoir avant de vous lancer.',
          textAlign: 'center',
        },
        [],
        {
          desktop: { color: '#71717a', marginBottom: '28px' },
          mobile: { marginBottom: '20px' },
        },
      ),
      node(
        'preset-faq-list',
        'core/stack',
        { direction: 'column', gap: 'sm' },
        [
          [
            'Quels sont les délais de livraison ?',
            'Les commandes sont préparées avec soin et expédiées sous 2 à 4 jours ouvrés.',
          ],
          [
            'Puis-je retourner ma commande ?',
            'Vous disposez de 30 jours après réception pour demander un retour.',
          ],
          [
            'Comment contacter votre équipe ?',
            'Écrivez-nous à bonjour@exemple.fr, nous vous répondrons rapidement.',
          ],
          [
            'Les paiements sont-ils sécurisés ?',
            'Les paiements sont traités par notre prestataire sécurisé.',
          ],
        ].map(([question, answer], index) =>
          node(
            `preset-faq-item-${index + 1}`,
            'core/container',
            { maxWidth: 'none', padding: 'md', backgroundColor: '#f8fafc' },
            [
              node(
                `preset-faq-question-${index + 1}`,
                'core/heading',
                {
                  text: question!,
                  level: 3,
                },
                [],
                {
                  desktop: { marginBottom: '8px', fontSize: '17px' },
                  mobile: { fontSize: '16px' },
                },
              ),
              node(
                `preset-faq-answer-${index + 1}`,
                'core/text',
                {
                  content: answer!,
                },
                [],
                {
                  desktop: { color: '#52525b', lineHeight: '1.7' },
                },
              ),
            ],
            {
              desktop: { borderRadius: '12px' },
            },
          ),
        ),
      ),
    ]),
  ],
);

const newsletter = section(
  'preset-newsletter',
  'Inscription à la newsletter',
  {
    desktop: { backgroundColor: '#ecfeff', paddingTop: '56px', paddingBottom: '56px' },
    tablet: { paddingTop: '44px', paddingBottom: '44px' },
    mobile: { paddingTop: '32px', paddingBottom: '32px' },
  },
  [
    node('preset-newsletter-container', 'core/container', { maxWidth: 'lg', padding: 'lg' }, [
      node(
        'preset-newsletter-content',
        'core/stack',
        { direction: 'row', gap: 'lg', alignItems: 'center', justifyContent: 'space-between' },
        [
          node(
            'preset-newsletter-copy',
            'core/stack',
            { direction: 'column', gap: 'sm' },
            [
              node(
                'preset-newsletter-heading',
                'core/heading',
                {
                  text: 'Un peu de beau dans votre boîte mail',
                  level: 2,
                },
                [],
                {
                  desktop: { marginBottom: '0' },
                  mobile: { fontSize: '26px', textAlign: 'center' },
                },
              ),
              node(
                'preset-newsletter-description',
                'core/text',
                {
                  content: 'Recevez nos nouveautés et offres en avant-première.',
                },
                [],
                {
                  desktop: { color: '#52525b' },
                  mobile: { textAlign: 'center' },
                },
              ),
            ],
            {
              mobile: { alignItems: 'center' },
            },
          ),
          node(
            'preset-newsletter-button',
            'core/button',
            {
              label: 'Je m’inscris',
              url: '#inscription',
              variant: 'primary',
              size: 'lg',
            },
            [],
            {
              mobile: { width: '100%' },
            },
          ),
        ],
        {
          desktop: {},
          mobile: {
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '20px',
          },
        },
      ),
    ]),
  ],
);

const footer = section(
  'preset-footer',
  'Pied de page',
  {
    desktop: { backgroundColor: '#18181b', paddingTop: '52px', paddingBottom: '24px' },
    tablet: { paddingTop: '40px', paddingBottom: '20px' },
    mobile: { paddingTop: '32px', paddingBottom: '20px' },
  },
  [
    node('preset-footer-container', 'core/container', { maxWidth: 'xl', padding: 'lg' }, [
      node(
        'preset-footer-grid',
        'core/grid',
        { columns: 3, gap: 'xl' },
        [
          node('preset-footer-brand', 'core/stack', { direction: 'column', gap: 'sm' }, [
            node(
              'preset-footer-brand-title',
              'core/heading',
              {
                text: 'Votre marque',
                level: 3,
              },
              [],
              {
                desktop: { color: '#ffffff' },
              },
            ),
            node(
              'preset-footer-brand-copy',
              'core/text',
              {
                content: 'Des produits choisis avec soin, pour vous accompagner chaque jour.',
              },
              [],
              {
                desktop: { color: '#a1a1aa', lineHeight: '1.7' },
              },
            ),
          ]),
          node('preset-footer-navigation', 'core/stack', { direction: 'column', gap: 'sm' }, [
            node(
              'preset-footer-navigation-title',
              'core/heading',
              {
                text: 'Explorer',
                level: 4,
              },
              [],
              {
                desktop: { color: '#ffffff' },
              },
            ),
            node('preset-footer-link-1', 'core/text', { content: 'La boutique' }, [], {
              desktop: { color: '#a1a1aa' },
            }),
            node('preset-footer-link-2', 'core/text', { content: 'Notre histoire' }, [], {
              desktop: { color: '#a1a1aa' },
            }),
            node('preset-footer-link-3', 'core/text', { content: 'Contact' }, [], {
              desktop: { color: '#a1a1aa' },
            }),
          ]),
          node('preset-footer-help', 'core/stack', { direction: 'column', gap: 'sm' }, [
            node(
              'preset-footer-help-title',
              'core/heading',
              {
                text: 'Besoin d’aide ?',
                level: 4,
              },
              [],
              {
                desktop: { color: '#ffffff' },
              },
            ),
            node(
              'preset-footer-help-copy',
              'core/text',
              {
                content: 'bonjour@exemple.fr',
              },
              [],
              {
                desktop: { color: '#a1a1aa' },
              },
            ),
            node(
              'preset-footer-hours',
              'core/text',
              {
                content: 'Du lundi au vendredi, 9 h - 18 h',
              },
              [],
              {
                desktop: { color: '#a1a1aa' },
              },
            ),
          ]),
        ],
        {
          desktop: { gridTemplateColumns: '1.4fr 1fr 1fr' },
          tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' },
          mobile: { gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' },
        },
      ),
      node('preset-footer-divider', 'core/divider', { color: '#3f3f46' }, [], {
        desktop: { marginTop: '36px', marginBottom: '20px' },
        mobile: { marginTop: '24px', marginBottom: '16px' },
      }),
      node(
        'preset-footer-copyright',
        'core/text',
        {
          content: '© 2026 Votre marque. Tous droits réservés.',
          textAlign: 'center',
        },
        [],
        {
          desktop: { color: '#a1a1aa', fontSize: '13px' },
        },
      ),
    ]),
  ],
);

export const SECTION_PRESETS: readonly SectionPreset[] = [
  {
    id: 'header',
    name: 'En-tête',
    description: 'Logo, navigation et bouton d’action adaptés au mobile.',
    section: header,
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'Introduction, proposition de valeur et appel à l’action.',
    section: hero,
  },
  {
    id: 'hero-editorial',
    name: 'Hero avec visuel',
    description: 'Bannière d’accueil en deux colonnes, avec mise en page mobile.',
    section: heroEditorial,
  },
  {
    id: 'feature-grid',
    name: 'Feature grid',
    description: 'Trois cartes de contenu avec une grille responsive.',
    section: featureGrid,
  },
  {
    id: 'product-collection',
    name: 'Sélection de produits',
    description: 'Grille de produits qui passe en deux colonnes sur tablette et une sur mobile.',
    section: productCollection,
  },
  {
    id: 'testimonials',
    name: 'Témoignages',
    description: 'Cartes de témoignages en grille responsive.',
    section: testimonials,
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Questions fréquentes et réponses, présentées clairement sur tous les écrans.',
    section: faq,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Bandeau d’inscription avec appel à l’action empilé sur mobile.',
    section: newsletter,
  },
  {
    id: 'call-to-action',
    name: 'Call to action',
    description: 'Bandeau de conversion avec titre et bouton.',
    section: callToAction,
  },
  {
    id: 'footer',
    name: 'Pied de page',
    description: 'Marque, navigation et contact avec colonnes adaptatives.',
    section: footer,
  },
];
