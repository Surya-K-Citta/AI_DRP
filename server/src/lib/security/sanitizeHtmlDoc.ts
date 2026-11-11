import sanitizeHtml from 'sanitize-html';

/**
 * Cleans a full HTML document before it is printed to PDF. The page is also run with JavaScript off and with
 * every network and file request blocked (see pdfPage.ts), so this is the second layer.
 *
 * What survives: text, tables, lists, headings, images given as data:image URIs, inline styles without url()
 * and the document's own <style> sheets with @import and external url() removed.
 */

const BODY_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'div', 'dl', 'dt', 'em',
  'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'ins', 'li', 'mark',
  'ol', 'p', 'pre', 'q', 's', 'section', 'small', 'span', 'strong', 'sub', 'sup', 'svg', 'g', 'path', 'rect', 'circle',
  'line', 'polyline', 'polygon', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul', 'article', 'aside', 'main', 'nav',
];

const SAFE_IMG = /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i;
const SAFE_STYLE_VALUE = /^[^;]*$/;

export function cleanCss(css: string): string {
  return css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/behavior\s*:[^;}]*/gi, '')
    .replace(/-moz-binding\s*:[^;}]*/gi, '')
    .replace(/url\(\s*(['"]?)(?!data:)[^)]*\1\s*\)/gi, 'none');
}

function cleanInlineStyle(style: string): string {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && SAFE_STYLE_VALUE.test(part) && !/url\s*\(|expression\s*\(|javascript\s*:|@import|behavior\s*:|binding\s*:/i.test(part))
    .join('; ');
}

export function sanitizeHtmlDocument(html: string): string {
  const styles: string[] = [];
  const styleBlock = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = styleBlock.exec(html)) !== null) styles.push(cleanCss(match[1]));

  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(html);
  const fragment = (bodyMatch ? bodyMatch[1] : html).replace(styleBlock, '');

  const body = sanitizeHtml(fragment, {
    allowedTags: BODY_TAGS,
    allowedAttributes: {
      '*': ['class', 'id', 'style', 'colspan', 'rowspan', 'align', 'valign', 'width', 'height', 'data-page-size', 'data-page-push', 'data-dpr-styled', 'data-wide-landscape'],
      a: ['href', 'title'],
      img: ['src', 'alt', 'width', 'height'],
      svg: ['viewbox', 'width', 'height', 'fill', 'xmlns'],
      path: ['d', 'fill', 'stroke', 'stroke-width'],
      g: ['fill', 'stroke'],
      rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'rx'],
      circle: ['cx', 'cy', 'r', 'fill', 'stroke'],
      line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
      polyline: ['points', 'fill', 'stroke'],
      polygon: ['points', 'fill', 'stroke'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowedSchemesByTag: { img: ['data'], a: ['http', 'https', 'mailto', 'tel'] },
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'template'],
    transformTags: {
      '*': (tagName, attribs) => {
        const next = { ...attribs };
        if (next.style !== undefined) next.style = cleanInlineStyle(next.style);
        if (tagName === 'img' && next.src && !SAFE_IMG.test(next.src)) delete next.src;
        return { tagName, attribs: next };
      },
    },
  });

  return `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8" />\n<style>${styles.join('\n')}</style>\n</head>\n<body>${body}</body>\n</html>`;
}
