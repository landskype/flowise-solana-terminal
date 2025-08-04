import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import { TERMINAL_FONT } from '../theme';
import { extractTextFromChildren } from '../utils';

// Компонент для блоков кода с подсветкой синтаксиса
const CodeBlock: React.FC<
  React.HTMLAttributes<HTMLPreElement> & { children?: React.ReactNode }
> = ({ children, className, ...props }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children]);

  const handleCopy = () => {
    const textToCopy = extractTextFromChildren(children);
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log('Code block copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy code block:', err);
      });
  };

  // Определяем язык из className (например, "language-javascript")
  const language = className?.replace('language-', '') || 'text';

  return (
    <pre
      {...props}
      className='terminal-pre bg-gray-900 text-green-400 p-3 rounded border border-gray-700 overflow-x-auto my-2'
      style={{ fontFamily: TERMINAL_FONT }}
      onClick={handleCopy}
      title='Click to copy'
    >
      <code
        ref={codeRef}
        className={`language-${language}`}
        style={{ fontFamily: TERMINAL_FONT }}
      >
        {children}
      </code>
    </pre>
  );
};

export default CodeBlock;
