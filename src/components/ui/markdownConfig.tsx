import React from 'react';
import { TERMINAL_FONT } from '../theme';
import { extractTextFromChildren } from '../utils';

export const markdownComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      className='underline text-terminal-green hover:text-terminal-green-faded'
      target='_blank'
      rel='noopener noreferrer'
    />
  ),
  code: (
    props: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
  ) => {
    const handleCopy = () => {
      const textToCopy = extractTextFromChildren(props.children);
      navigator.clipboard.writeText(textToCopy).then(() => {
        // TODO: Show a notification on copy success
        console.log('Code copied to clipboard');
      });
    };
    return (
      <code
        {...props}
        className='terminal-code'
        style={{ fontFamily: TERMINAL_FONT }}
        onClick={handleCopy}
        title='Click to copy'
      />
    );
  },
  pre: (
    props: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
  ) => {
    const handleCopy = () => {
      const textToCopy = extractTextFromChildren(props.children);
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          // TODO: Show a notification on copy success
          console.log('Code block copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy code block:', err);
        });
    };
    return (
      <pre
        {...props}
        className='terminal-pre'
        style={{ fontFamily: TERMINAL_FONT }}
        onClick={handleCopy}
        title='Click to copy'
      />
    );
  },
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li
      {...props}
      className='ml-4 list-disc'
      style={{ margin: 0, padding: 0 }}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} style={{ margin: 0, padding: 0 }} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} style={{ margin: 0, padding: 0 }} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} style={{ margin: 0, padding: 0 }} />
  ),
};
