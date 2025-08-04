// utils.ts
// Utility functions for the Matrix terminal chat UI

import React from 'react';

/**
 * Recursively extracts all text from React children (for code copy logic).
 */
export function extractTextFromChildren(children: React.ReactNode): string {
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (typeof children === 'string') return children;
  if (
    React.isValidElement(children) &&
    children.props &&
    typeof children.props === 'object' &&
    'children' in children.props
  ) {
    return extractTextFromChildren(
      (children.props as { children?: React.ReactNode }).children
    );
  }
  return '';
}
