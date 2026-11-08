import React from 'react';
import Link from 'next/link';

const features = [
  {
    title: 'Rendu typé',
    description: 'Chaque document est validé par le schéma partagé de @dsk/core.',
  },
  {
    title: 'Composants réutilisables',
    description: 'Un registre commun relie les composants à leur rendu et à leurs propriétés.',
  },
  {
    title: 'Aperçu responsive',
    description: 'Prévisualisez vos pages sur ordinateur, tablette et mobile.',
  },
] as const;

export const Playground: React.FC = () => (
  <main className="playground-home">
    <div className="playground-home-inner">
      <nav className="playground-home-nav" aria-label="Navigation principale">
        <div className="playground-home-brand">
          <span className="playground-home-brand-mark" aria-hidden="true">
            D
          </span>
          <span>DSK Visual Engine</span>
        </div>
        <Link className="playground-home-nav-link" href="/editor">
          Ouvrir l’éditeur <span aria-hidden="true">↗</span>
        </Link>
      </nav>

      <section className="playground-home-hero">
        <span className="playground-kicker">PLAYGROUND · ÉDITEUR VISUEL</span>
        <h1>Des pages soignées. Sans partir de zéro.</h1>
        <p className="playground-home-copy">
          Composez des expériences storefront avec des composants réutilisables, un rendu contrôlé
          et un aperçu adapté à chaque écran.
        </p>
        <Link className="playground-home-cta" href="/editor">
          <span>Explorer l’éditeur</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="playground-home-features" aria-label="Fonctionnalités du Playground">
        {features.map(({ title, description }) => (
          <article className="playground-feature-card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </div>
  </main>
);
