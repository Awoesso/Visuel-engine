import React from 'react';
import Link from 'next/link';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '72px 24px',
  background: 'linear-gradient(145deg, #f8f9ff 0%, #eef2ff 100%)',
  color: '#172033',
  fontFamily: "var(--font-geist-sans, 'Geist'), Arial, sans-serif",
};

export const Playground: React.FC = () => (
  <main style={pageStyle}>
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <p style={{ color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.14em' }}>
        DSK VISUAL ENGINE
      </p>
      <h1 style={{ maxWidth: 680, margin: '14px 0', fontSize: 48, lineHeight: 1.08 }}>
        Assemblez des pages avec des composants réutilisables.
      </h1>
      <p style={{ maxWidth: 600, color: '#657087', fontSize: 17, lineHeight: 1.7 }}>
        Le Playground présente le moteur de rendu et son éditeur visuel. Le document de
        démonstration utilise le schéma et le registre de composants partagés.
      </p>
      <Link
        href="/editor"
        style={{
          display: 'inline-flex',
          marginTop: 16,
          padding: '12px 18px',
          borderRadius: 8,
          background: '#4f46e5',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Ouvrir l’éditeur
      </Link>
      <section
        aria-label="Fonctionnalités du Playground"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginTop: 64,
        }}
      >
        {(
          [
            ['Rendu typé', 'Les documents sont validés par le schéma réel de @dsk/core.'],
            ['Registry partagé', 'Les composants core sont résolus par leurs IDs de registre.'],
            ['Aperçu responsive', 'Basculez entre les largeurs Desktop, Tablet et Mobile.'],
          ] as const
        ).map(([title, description]) => (
          <article
            key={title}
            style={{
              padding: 22,
              border: '1px solid #e3e7f2',
              borderRadius: 12,
              background: '#fff',
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{title}</h2>
            <p style={{ margin: 0, color: '#657087', fontSize: 13, lineHeight: 1.6 }}>
              {description}
            </p>
          </article>
        ))}
      </section>
    </div>
  </main>
);
