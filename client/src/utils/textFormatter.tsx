// @ts-nocheck
import React from 'react';

/**
 * Process markdown bold markers (**text**) and convert to React elements
 */
export function processMarkdownBold(text: string): React.ReactNode[] {
  if (!text) return [];

  const segments: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold marker
    if (match.index > lastIndex) {
      segments.push(
        <span key={key++}>{text.substring(lastIndex, match.index)}</span>
      );
    }

    // Add the bold text (without markers)
    segments.push(
      <strong key={key++}>{match[1]}</strong>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    segments.push(
      <span key={key++}>{text.substring(lastIndex)}</span>
    );
  }

  // If no matches found, return the whole text as non-bold
  if (segments.length === 0) {
    segments.push(<span key={0}>{text}</span>);
  }

  return segments;
}

/**
 * Process text with markdown formatting (bold and headings)
 * Returns array of React elements with proper formatting
 */
export function processMarkdownText(text: string): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  let key = 0;

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Check if it's a heading-1 (#) - must start with # but not ## or ###
    if (/^#\s/.test(trimmedLine) || (trimmedLine.startsWith('#') && !trimmedLine.startsWith('##'))) {
      const headingText = trimmedLine.replace(/^#+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const boldSegments = processMarkdownBold(headingText);
        
        elements.push(
          <h1 
            key={key++} 
            className="text-xl font-semibold mt-8 mb-4 text-gray-900"
            style={{ fontWeight: 600 }}
          >
            {boldSegments}
          </h1>
        );
      }
    }
    // Check if it's a heading-2 (##) - must start with ## but not ###
    else if (/^##\s/.test(trimmedLine) || (trimmedLine.startsWith('##') && !trimmedLine.startsWith('###'))) {
      const headingText = trimmedLine.replace(/^##+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const boldSegments = processMarkdownBold(headingText);
        
        elements.push(
          <h2 
            key={key++} 
            className="text-lg font-semibold mt-6 mb-3 text-gray-900"
            style={{ fontWeight: 600 }}
          >
            {boldSegments}
          </h2>
        );
      }
    }
    // Check if it's a heading-3 (###)
    else if (/^###+\s/.test(trimmedLine) || trimmedLine.startsWith('###')) {
      const headingText = trimmedLine.replace(/^###+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const boldSegments = processMarkdownBold(headingText);
        
        elements.push(
          <h3 
            key={key++} 
            className="text-base font-semibold mt-4 mb-2 text-gray-900"
            style={{ fontWeight: 600 }}
          >
            {boldSegments}
          </h3>
        );
      }
    } else if (trimmedLine.length > 0) {
      // Regular text paragraph - remove any stray # markers that might have been missed
      const cleanLine = trimmedLine.replace(/^#+\s*/g, '');
      const boldSegments = processMarkdownBold(cleanLine);
      elements.push(
        <p key={key++} className="mb-2">
          {boldSegments}
        </p>
      );
    } else if (lineIndex < lines.length - 1) {
      // Empty line for spacing (but not the last line)
      elements.push(<br key={key++} />);
    }
  });

  return elements.length > 0 ? elements : [<span key={0}>{text.replace(/^#+\s*/gm, '')}</span>];
}

/**
 * React component to render text with markdown formatting (bold and headings)
 */
export const FormattedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const formatted = processMarkdownText(text);
  return <div className={className}>{formatted}</div>;
};

