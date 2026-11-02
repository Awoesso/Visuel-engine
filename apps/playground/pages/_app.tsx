import type { AppProps } from 'next/app';
import localFont from 'next/font/local';
import '@dsk/editor/style.css';

const GeistSans = localFont({
  src: '../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export default function PlaygroundApp({ Component, pageProps }: AppProps) {
  return (
    <div className={GeistSans.className}>
      <Component {...pageProps} />
    </div>
  );
}
