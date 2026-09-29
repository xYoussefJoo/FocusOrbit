'use client';

import Editor, { type BeforeMount } from '@monaco-editor/react';

// Monaco doesn't read CSS variables for syntax colors, so the Vesper token
// values are repeated here. Keep them in sync with globals.css.
const defineVesperTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('vesper', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'F2B544' },
      { token: 'string', foreground: 'A8C7FA' },
      { token: 'type', foreground: 'C9A8F5' },
      { token: 'type.identifier', foreground: 'C9A8F5' },
      { token: 'number', foreground: 'C9A8F5' },
      { token: 'comment', foreground: '7A8295', fontStyle: 'italic' },
      { token: 'annotation', foreground: '9097A8' },
    ],
    colors: {
      'editor.background': '#0A0C12',
      'editor.foreground': '#E7E9F0',
      'editorLineNumber.foreground': '#4A5263',
      'editorLineNumber.activeForeground': '#9097A8',
      'editor.lineHighlightBackground': '#10131B',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#F2B5442E',
      'editorCursor.foreground': '#F2B544',
      'editorIndentGuide.background1': '#1A1E28',
      'editorWidget.background': '#171B25',
      'editorWidget.border': '#252B38',
      'scrollbarSlider.background': '#252B3899',
    },
  });
};

type Props = { path: string; language: string; value: string };

export function CodePane({ path, language, value }: Props) {
  return (
    <Editor
      height="100%"
      path={path}
      language={language}
      defaultValue={value}
      theme="vesper"
      beforeMount={defineVesperTheme}
      loading={<div className="p-6 text-sm text-ink-muted">Loading editor…</div>}
      options={{
        fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
        fontSize: 13,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 20 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        automaticLayout: true,
      }}
    />
  );
}
