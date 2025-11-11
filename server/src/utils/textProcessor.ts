// @ts-nocheck
/**
 * Utility functions for processing text content
 */

export interface TextSegment {
  text: string;
  bold: boolean;
  isHeading?: boolean; // For ### headings
}

/**
 * Process markdown bold markers (**text**) and convert to structured format
 * @param text - Text with markdown bold markers
 * @returns Array of text segments with bold formatting information
 */
export function processMarkdownBold(text: string): TextSegment[] {
  if (!text) return [{ text: '', bold: false }];

  const segments: TextSegment[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold marker
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        bold: false,
      });
    }

    // Add the bold text (without markers)
    segments.push({
      text: match[1],
      bold: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      bold: false,
    });
  }

  // If no matches found, return the whole text as non-bold
  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

/**
 * Remove markdown bold markers and return plain text
 * @param text - Text with markdown bold markers
 * @returns Plain text without markdown markers
 */
export function removeMarkdownBold(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
}

/**
 * Check if text contains markdown bold markers
 * @param text - Text to check
 * @returns True if text contains markdown bold markers
 */
export function hasMarkdownBold(text: string): boolean {
  return /\*\*.*?\*\*/.test(text);
}

/**
 * Process text with markdown formatting (bold and headings)
 * Splits text into paragraphs and processes each paragraph
 * @param text - Text with markdown formatting
 * @returns Array of processed paragraphs
 */
export interface ProcessedParagraph {
  type: 'heading' | 'text';
  headingLevel?: 1 | 2 | 3; // 1 for #, 2 for ##, 3 for ###
  content: TextSegment[];
  originalText: string;
}

export function processMarkdownText(text: string): ProcessedParagraph[] {
  if (!text) return [];

  const paragraphs: ProcessedParagraph[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if it's a heading-1 (#) - must start with exactly one #
    if (/^#\s/.test(trimmedLine) || (trimmedLine.startsWith('#') && trimmedLine.length > 1 && !trimmedLine.startsWith('##'))) {
      const headingText = trimmedLine.replace(/^#+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const segments = processMarkdownBold(headingText);
        paragraphs.push({
          type: 'heading',
          headingLevel: 1,
          content: segments.map(seg => ({ ...seg, isHeading: true })),
          originalText: headingText,
        });
      }
    }
    // Check if it's a heading-2 (##) - must start with exactly two #
    else if (/^##\s/.test(trimmedLine) || (trimmedLine.startsWith('##') && trimmedLine.length > 2 && !trimmedLine.startsWith('###'))) {
      const headingText = trimmedLine.replace(/^##+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const segments = processMarkdownBold(headingText);
        paragraphs.push({
          type: 'heading',
          headingLevel: 2,
          content: segments.map(seg => ({ ...seg, isHeading: true })),
          originalText: headingText,
        });
      }
    }
    // Check if it's a heading-3 (###) - must start with exactly three #
    else if (/^###+\s/.test(trimmedLine) || trimmedLine.startsWith('###')) {
      const headingText = trimmedLine.replace(/^###+\s*/, '').trim();
      if (headingText) {
        // Process bold markers within heading
        const segments = processMarkdownBold(headingText);
        paragraphs.push({
          type: 'heading',
          headingLevel: 3,
          content: segments.map(seg => ({ ...seg, isHeading: true })),
          originalText: headingText,
        });
      }
    } else if (trimmedLine.length > 0) {
      // Regular text paragraph - remove any stray # markers
      const cleanText = trimmedLine.replace(/^#+\s*/g, '');
      const segments = processMarkdownBold(cleanText);
      paragraphs.push({
        type: 'text',
        content: segments,
        originalText: cleanText,
      });
    } else {
      // Empty line - add as empty paragraph
      paragraphs.push({
        type: 'text',
        content: [{ text: '', bold: false }],
        originalText: '',
      });
    }
  }

  return paragraphs;
}

/**
 * Remove markdown heading markers (#, ##, and ###)
 * @param text - Text with markdown heading markers
 * @returns Plain text without heading markers
 */
export function removeMarkdownHeadings(text: string): string {
  if (!text) return '';
  return text.replace(/^#+\s*/gm, '');
}

/**
 * Remove all markdown markers (bold and headings)
 * @param text - Text with markdown markers
 * @returns Plain text without markdown markers
 */
export function removeAllMarkdown(text: string): string {
  if (!text) return '';
  return removeMarkdownBold(removeMarkdownHeadings(text));
}

