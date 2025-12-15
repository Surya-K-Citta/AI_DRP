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
 * Process text with markdown formatting (bold, headings, and tables)
 * Returns array of React elements with proper formatting
 */
export function processMarkdownText(text: string): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  let key = 0;
  let inTable = false;
  let tableRows: string[][] = [];
  let pendingParagraph: string[] = []; // Collect lines for a paragraph

  const flushParagraph = () => {
    if (pendingParagraph.length > 0) {
      const paragraphText = pendingParagraph.join(' ').trim();
      if (paragraphText) {
        const cleanLine = paragraphText.replace(/^#+\s*/g, '');
        const boldSegments = processMarkdownBold(cleanLine);
        elements.push(
          <p 
            key={key++} 
            className="mb-4 text-gray-700 leading-relaxed"
            style={{
              display: 'block',
              width: '100%',
              clear: 'both',
              marginTop: '0.5rem',
              marginBottom: '1rem',
              textAlign: 'left',
              paddingLeft: '0',
              paddingRight: '0'
            }}
          >
            {boldSegments}
          </p>
        );
      }
      pendingParagraph = [];
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmedLine = line.trim();
    
    // Check if it's a markdown table row (contains |)
    const isTableRow = trimmedLine.includes('|') && trimmedLine.split('|').length > 2;
    const isTableSeparator = /^\|[\s\-:]+\|/.test(trimmedLine);
    
    if (isTableRow && !isTableSeparator) {
      // Flush any pending paragraph before starting table
      flushParagraph();
      
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Parse table row
      const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
      if (cells.length > 0) {
        tableRows.push(cells);
      }
      continue;
    } else if (isTableSeparator) {
      // Skip separator row
      continue;
    } else if (inTable && !isTableRow) {
      // End of table - render table
      if (tableRows.length > 0) {
        elements.push(renderMarkdownTable(tableRows, key++));
        tableRows = [];
      }
      inTable = false;
      // Add proper spacing after table - ensure content flows below, not beside, and is left-aligned
      elements.push(
        <div 
          key={key++} 
          style={{ 
            clear: 'both',
            display: 'block',
            width: '100%',
            marginTop: '1rem',
            marginBottom: '1rem',
            textAlign: 'left'
          }} 
        />
      );
    }
    
    // If we're in a table, skip other processing
    if (inTable) continue;
    
    // Check if it's a heading-1 (#) - must start with # but not ## or ###
    if (/^#\s/.test(trimmedLine) || (trimmedLine.startsWith('#') && !trimmedLine.startsWith('##'))) {
      flushParagraph(); // Flush any pending paragraph before heading
      const headingText = trimmedLine.replace(/^#+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const boldSegments = processMarkdownBold(headingText);
        
        elements.push(
          <h1 
            key={key++} 
            className="text-xl font-bold mt-8 mb-4 text-gray-900"
            style={{ 
              fontWeight: 700,
              textAlign: 'left',
              width: '100%',
              clear: 'both'
            }}
          >
            {boldSegments}
          </h1>
        );
      }
    }
    // Check if it's a heading-2 (##) - must start with ## but not ###
    else if (/^##\s/.test(trimmedLine) || (trimmedLine.startsWith('##') && !trimmedLine.startsWith('###'))) {
      flushParagraph(); // Flush any pending paragraph before heading
      const headingText = trimmedLine.replace(/^##+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const boldSegments = processMarkdownBold(headingText);
        
        elements.push(
          <h2 
            key={key++} 
            className="text-lg font-bold mt-6 mb-3 text-gray-900"
            style={{ 
              fontWeight: 700,
              textAlign: 'left',
              width: '100%',
              clear: 'both'
            }}
          >
            {boldSegments}
          </h2>
        );
      }
    }
    // Check if it's a heading-3 (###)
    else if (/^###+\s/.test(trimmedLine) || trimmedLine.startsWith('###')) {
      flushParagraph(); // Flush any pending paragraph before heading
      const headingText = trimmedLine.replace(/^###+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const boldSegments = processMarkdownBold(headingText);
        
        elements.push(
          <h3 
            key={key++} 
            className="text-base font-semibold mt-4 mb-2 text-gray-900"
            style={{ 
              fontWeight: 600,
              textAlign: 'left',
              width: '100%',
              clear: 'both'
            }}
          >
            {boldSegments}
          </h3>
        );
      }
    } else if (trimmedLine.length > 0) {
      // Regular text - collect into paragraph (handle multi-line paragraphs)
      pendingParagraph.push(trimmedLine);
    } else {
      // Empty line - flush current paragraph and add spacing
      flushParagraph();
      // Only add spacing if not at the end
      if (lineIndex < lines.length - 1) {
        elements.push(<div key={key++} className="mb-2" />);
      }
    }
  }

  // Flush any remaining paragraph
  flushParagraph();

  // Handle table at end of text
  if (inTable && tableRows.length > 0) {
    elements.push(renderMarkdownTable(tableRows, key++));
  }

  return elements.length > 0 ? elements : [<span key={0}>{text.replace(/^#+\s*/gm, '')}</span>];
}

/**
 * Render a markdown table as a styled HTML table (matching document format - all white rows)
 * Tables are always full-width block elements with proper spacing
 */
function renderMarkdownTable(tableRows: string[][], key: number): React.ReactNode {
  if (!tableRows || tableRows.length === 0) return null;

  const headerRow = tableRows[0];
  const dataRows = tableRows.slice(1);

  return (
    <div 
      key={key} 
      className="my-6 w-full"
      style={{ 
        display: 'block',
        width: '100%',
        clear: 'both',
        marginTop: '1.5rem',
        marginBottom: '1.5rem'
      }}
    >
      <div className="overflow-x-auto w-full">
        <table 
          className="w-full border-collapse" 
          style={{ 
            width: '100%',
            border: '2px solid #000000',
            display: 'table',
            tableLayout: 'auto'
          }}
        >
          <thead>
            <tr>
              {headerRow.map((cell, colIndex) => {
                const cellContent = processMarkdownBold(cell);
                return (
                  <th
                    key={colIndex}
                    className="border-2 border-black px-4 py-3 text-left font-bold text-sm text-gray-900"
                    style={{ 
                      backgroundColor: '#D3D3D3',
                      border: '2px solid #000000',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cellContent}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000'
                }}
              >
                {row.map((cell, colIndex) => {
                  const cellContent = processMarkdownBold(cell);
                  return (
                    <td
                      key={colIndex}
                      className="border-2 border-black px-4 py-3 text-sm text-gray-900"
                      style={{ border: '2px solid #000000' }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * React component to render text with markdown formatting (bold, headings, and tables)
 */
export const FormattedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const formatted = processMarkdownText(text);
  return (
    <div 
      className={`prose prose-sm max-w-none ${className || ''}`} 
      style={{ 
        lineHeight: '1.75',
        color: '#374151',
        display: 'block',
        width: '100%',
        clear: 'both',
        textAlign: 'left',
        marginLeft: '0',
        marginRight: '0',
        paddingLeft: '0',
        paddingRight: '0'
      }}
    >
      <div style={{ 
        display: 'block',
        width: '100%',
        clear: 'both',
        textAlign: 'left',
        paddingLeft: '0',
        paddingRight: '0',
        marginLeft: '0',
        marginRight: '0'
      }}>
        {formatted}
      </div>
    </div>
  );
};

