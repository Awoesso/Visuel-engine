import dynamic from 'next/dynamic';
import React from 'react';

const EditorApp = dynamic(() => import('@dsk/editor').then((m) => m.EditorApp), {
  ssr: false,
});

export default function EditorPage() {
  return <EditorApp />;
}
