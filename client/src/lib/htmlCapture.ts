// @ts-nocheck
/**
 * Capture an element's HTML along with all same-origin stylesheets in the current document.
 * This is used to generate a PDF that matches the on-screen React preview 1:1.
 */

/**
 * Convert an image URL to a base64 data URL
 * This is necessary because the server-side PDF generator cannot access images from the client
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
  // Skip if already a data URL
  if (url.startsWith('data:')) {
    return url;
  }

  // Skip placeholder/invalid URLs
  if (!url || url.trim() === '' || url.includes('placeholder')) {
    return null;
  }

  try {
    // Fetch the image
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'include' // Include credentials for authenticated images
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url}, status: ${response.status}`);
      return null;
    }

    const blob = await response.blob();

    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.warn(`Failed to read image blob: ${url}`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Error converting image to base64: ${url}`, error);

    // Fallback: try using canvas method
    try {
      return await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            try {
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } catch (e) {
              console.warn(`Canvas toDataURL failed for: ${url}`, e);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          console.warn(`Image load failed for: ${url}`);
          resolve(null);
        };
        img.src = url;
      });
    } catch (canvasError) {
      console.warn(`Canvas fallback failed for: ${url}`, canvasError);
      return null;
    }
  }
}

/**
 * Convert all images in an element to base64 data URLs
 */
async function convertImagesToBase64(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const promises: Promise<void>[] = [];

  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      const promise = imageUrlToBase64(src).then((base64) => {
        if (base64) {
          img.setAttribute('src', base64);
          // Remove crossOrigin attribute as it's not needed for data URLs
          img.removeAttribute('crossOrigin');
        }
      });
      promises.push(promise);
    }
  });

  await Promise.all(promises);
}

export function captureElementAsStandaloneHTML(rootEl: Element): string {
  if (!rootEl) throw new Error('Root element not found');

  // Clone to avoid mutating the live DOM
  const clone = rootEl.cloneNode(true) as HTMLElement;

  // Add a marker class so we can target print fixes
  clone.classList.add('pdf-capture-root');

  // Remove image placeholders and upload/generate buttons before capturing
  const removeImagePlaceholders = (element: HTMLElement) => {
    // First, remove all interactive elements (buttons, file inputs)
    const buttons = element.querySelectorAll('button');
    buttons.forEach(btn => {
      const btnText = btn.textContent || '';
      const btnTitle = btn.getAttribute('title') || '';
      // Remove upload, generate, and remove buttons
      if (btnText.includes('Upload') || btnText.includes('Generate') ||
        btnTitle.includes('Remove') || btnTitle.includes('image')) {
        btn.remove();
      }
    });

    // Remove all file input elements
    const fileInputs = element.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.remove());

    // Find all image containers and check if they have valid images
    const imageContainers = element.querySelectorAll('div[class*="border-dashed"], div[class*="border-blue"], div[class*="relative inline-block"]');

    imageContainers.forEach((container) => {
      // Check if there's an actual image (img tag with valid src)
      const img = container.querySelector('img');
      const hasValidImage = img && img.src &&
        img.src.trim() !== '' &&
        !img.src.includes('data:image/svg+xml;base64,PHN2ZyB3aWR0aA') && // Placeholder SVG
        !img.src.includes('placeholder') &&
        img.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aA';

      // Check for placeholder indicators
      const containerText = container.textContent || '';
      const hasNoImageText = containerText.includes('No image') ||
        containerText.includes('Generating image') ||
        containerText.includes('Image Placeholder');

      // Check if container has SVG placeholder icon
      const hasPlaceholderIcon = container.querySelector('svg[viewBox*="24"]') && !hasValidImage;

      // If no valid image and has placeholder indicators, remove the entire image section
      if (!hasValidImage && (hasNoImageText || hasPlaceholderIcon)) {
        // Find the parent wrapper that contains this image section
        // Look for parent divs that might contain the image section wrapper
        let current: Element | null = container;
        let wrapperToRemove: Element | null = null;

        // Go up the DOM tree to find the wrapper div
        while (current && current !== element) {
          const parent = current.parentElement;
          if (!parent) break;

          // Check if this parent is a wrapper for the image section
          // Look for divs with classes like "my-6", "my-8", "flex", "text-center"
          const parentClasses = parent.className || '';
          const isImageWrapper = parentClasses.includes('my-6') ||
            parentClasses.includes('my-8') ||
            (parentClasses.includes('flex') && parentClasses.includes('items-center')) ||
            (parentClasses.includes('text-center') && parent.querySelector('div[class*="border"]'));

          if (isImageWrapper) {
            // Check if this wrapper only contains the placeholder (no other meaningful content)
            const children = Array.from(parent.children);
            const hasOtherContent = children.some(child => {
              if (child === current) return false;
              const childText = child.textContent?.trim() || '';
              // Allow headings and captions, but not placeholder text
              return childText.length > 0 &&
                !childText.includes('No image') &&
                !childText.includes('Generating image') &&
                !child.querySelector('button');
            });

            if (!hasOtherContent) {
              wrapperToRemove = parent;
            }
            break;
          }

          current = parent;
        }

        // Remove the wrapper or container
        if (wrapperToRemove) {
          wrapperToRemove.remove();
        } else if (container.parentElement) {
          // If no wrapper found, check if parent only contains this placeholder
          const parent = container.parentElement;
          const siblings = Array.from(parent.children).filter(child => child !== container);
          const hasSiblingContent = siblings.some(sibling => {
            const text = sibling.textContent?.trim() || '';
            return text.length > 0 && !text.includes('No image');
          });

          if (!hasSiblingContent && !parent.querySelector('h4, h3, h2')) {
            // Parent only contains placeholder, remove it
            parent.remove();
          } else {
            // Just remove the container
            container.remove();
          }
        } else {
          container.remove();
        }
      }
    });

    // Remove any remaining empty sections that only contained placeholders
    // But preserve sections that have headings or other meaningful content
    const sections = element.querySelectorAll('div[class*="my-6"], div[class*="my-8"]');
    sections.forEach(section => {
      const sectionText = section.textContent || '';
      const hasValidImage = section.querySelector('img[src]:not([src=""]):not([src*="data:image/svg+xml"])');
      const hasPlaceholderText = sectionText.includes('No image') || sectionText.includes('Generating image');

      // Check if section has meaningful headings or content (not just placeholder)
      const hasHeading = section.querySelector('h1, h2, h3, h4, h5, h6');
      const hasTable = section.querySelector('table');
      const hasList = section.querySelector('ul, ol');
      const hasOtherContent = hasHeading || hasTable || hasList;

      // If section only has placeholder text, no valid image, and no other meaningful content, remove it
      if (!hasValidImage && hasPlaceholderText && !hasOtherContent && sectionText.trim().length < 150) {
        // Double check: make sure we're not removing a section with a heading
        const headingText = hasHeading?.textContent || '';
        if (!headingText || headingText.length < 5) {
          section.remove();
        }
      }
    });

    // Final cleanup: remove any divs that are now empty after removing placeholders
    const allDivs = element.querySelectorAll('div');
    allDivs.forEach(div => {
      // Skip if div has meaningful content
      if (div.children.length > 0 || div.textContent?.trim().length > 0) {
        return;
      }
      // Remove completely empty divs that might have been wrappers
      const hasStyles = div.getAttribute('style') || div.className;
      if (!hasStyles || (hasStyles && !div.textContent?.trim())) {
        // Only remove if it's clearly a wrapper (has border or positioning classes)
        const classes = div.className || '';
        if (classes.includes('border') || classes.includes('relative') || classes.includes('absolute')) {
          div.remove();
        }
      }
    });
  };

  // Clean up placeholders before capturing
  removeImagePlaceholders(clone);

  // Post-process: Ensure all page containers match preview measurements EXACTLY
  const ensurePageStructure = (element: HTMLElement) => {
    // Find all page containers
    const pageContainers = element.querySelectorAll('div.page-break, div[style*="pageBreakAfter"], div[style*="21cm"]');

    pageContainers.forEach((container) => {
      const htmlElement = container as HTMLElement;
      const currentStyle = htmlElement.getAttribute('style') || '';
      let updatedStyle = currentStyle;

      // Ensure border matches PDF exactly (8px double border)
      if (!currentStyle.includes('border') && !currentStyle.includes('8px')) {
        updatedStyle += '; border: 8px double #2563EB;';
      }

      // Ensure dimensions match preview exactly
      if (!currentStyle.includes('width') && !currentStyle.includes('21cm')) {
        updatedStyle += '; width: 21cm;';
      }
      if (!currentStyle.includes('min-height') && !currentStyle.includes('29.7cm')) {
        updatedStyle += '; min-height: 29.7cm;';
      }

      // Ensure padding matches preview exactly (2cm)
      if (!currentStyle.includes('padding')) {
        updatedStyle += '; padding: 2cm;';
      }

      // Ensure margins match PDF (0 auto for horizontal centering, 0 for vertical)
      if (!currentStyle.includes('margin-left') && !currentStyle.includes('marginLeft')) {
        updatedStyle += '; margin-left: auto; margin-right: auto; margin-top: 0; margin-bottom: 0;';
      } else if (currentStyle.includes('marginBottom') || currentStyle.includes('margin-bottom')) {
        // Ensure marginBottom is 0 for PDF (matching preview)
        updatedStyle = updatedStyle.replace(/margin-bottom:\s*['"]?[^;'"]+['"]?/gi, 'margin-bottom: 0');
        updatedStyle = updatedStyle.replace(/marginBottom:\s*['"]?[^;'"]+['"]?/gi, 'marginBottom: 0');
      }

      // Ensure box-sizing and display properties match preview
      if (!currentStyle.includes('box-sizing') && !currentStyle.includes('boxSizing')) {
        updatedStyle += '; box-sizing: border-box;';
      }
      if (!currentStyle.includes('display')) {
        updatedStyle += '; display: flex; flex-direction: column;';
      }

      if (updatedStyle !== currentStyle) {
        htmlElement.setAttribute('style', updatedStyle);
      }
    });
  };

  // Ensure proper page structure
  ensurePageStructure(clone);

  // Collect CSS from all accessible stylesheets (Vite injected + Tailwind output included)
  let cssText = '';
  const styleSheets = Array.from(document.styleSheets || []);
  for (const sheet of styleSheets) {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        cssText += rule.cssText + '\n';
      }
    } catch (e) {
      // Ignore CORS-restricted stylesheets
    }
  }

  // Add print-specific fixes to preserve page breaks and remove default margins
  // Ensure exact matching with preview styles
  const printFixes = `
    @page { 
      size: A4; 
      margin: 0; 
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body { 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    .page-break { 
      break-after: page !important; 
      page-break-after: always !important; 
      page-break-inside: avoid !important;
    }
    [style*="pageBreakAfter"] {
      break-after: page !important;
      page-break-after: always !important;
    }
    .no-print { 
      display: none !important; 
    }
    /* Ensure proper page dimensions match preview EXACTLY */
    [style*="21cm"],
    div[style*="minHeight: '29.7cm'"],
    div[style*="min-height: 29.7cm"],
    div[style*="minHeight: 29.7cm"],
    div.page-break {
      width: 21cm !important;
      min-height: 29.7cm !important;
      padding: 2cm !important;
      margin-left: auto !important;
      margin-right: auto !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important; /* Preview uses 1cm for spacing, PDF uses 0 */
      box-sizing: border-box !important;
      break-after: page !important;
      page-break-after: always !important;
      page-break-inside: auto !important;
      overflow: visible !important;
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
    }
    /* Ensure all page containers have borders - CRITICAL for all pages - match preview exactly */
    div.page-break,
    div[class*="page-break"],
    div[style*="pageBreakAfter: 'always'"],
    div[style*="pageBreakAfter: always"],
    div[style*="border: '8px solid"],
    div[style*="border: 8px solid"],
    [style*="21cm"] {
      border: 8px solid #2563EB !important;
      border-style: double !important;
      position: relative !important;
      box-sizing: border-box !important;
    }
    /* Ensure decorative inner borders are preserved - match preview exactly */
    div[style*="border: '2px solid #3B82F6'"],
    div[style*="border: 2px solid #3B82F6"],
    div[style*="border: '2px solid"],
    div[style*="border: 2px solid"],
    div[style*="margin: '8px'"],
    div[style*="margin: 8px"] {
      border: 2px solid #3B82F6 !important;
    }
    /* Preserve inner border margin from preview */
    div[style*="margin: '8px'"],
    div[style*="margin: 8px"] {
      margin: 8px !important;
    }
    /* Force borders on all direct children of body that represent pages */
    body > div[class*="page-break"],
    body > div[style*="21cm"] {
      border: 8px solid #2563EB !important;
      border-style: double !important;
    }
    /* Hide any remaining interactive elements */
    button[class*="Upload"],
    button[class*="Generate"],
    button[title*="Remove"],
    button[title*="image"],
    input[type="file"] {
      display: none !important;
      visibility: hidden !important;
    }
    /* Ensure images display properly */
    img {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
    }
    /* Allow tables to break across pages if needed */
    table {
      page-break-inside: auto !important;
    }
    /* Ensure inner content containers match preview exactly */
    div[style*="minHeight: '29.7cm'"] > div[class*="relative z-10"],
    div[style*="min-height: 29.7cm"] > div[class*="relative z-10"],
    div.page-break > div[class*="relative z-10"] {
      width: 100% !important;
      min-height: 100% !important;
      height: auto !important;
      overflow: visible !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
    }
    /* Ensure borders and styles are preserved */
    * {
      box-sizing: border-box;
    }
    /* Prevent empty pages */
    div.page-break:empty,
    div[style*="pageBreakAfter"]:empty {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
    }
    /* Force page breaks for sections that should start on new page */
    div[style*="pageBreakAfter: 'always'"],
    div[style*="pageBreakAfter: always"] {
      break-after: page !important;
      page-break-after: always !important;
    }
  `;

  const fullHTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${printFixes}\n${cssText}</style>
  </head>
  <body style="margin: 0; padding: 0;">${clone.outerHTML}</body>
</html>`;

  return fullHTML;
}

/**
 * Async version of captureElementAsStandaloneHTML that converts images to base64
 * This should be used when generating PDFs to ensure images are embedded
 */
export async function captureElementAsStandaloneHTMLAsync(rootEl: Element): Promise<string> {
  if (!rootEl) throw new Error('Root element not found');

  // Clone to avoid mutating the live DOM
  const clone = rootEl.cloneNode(true) as HTMLElement;

  // Add a marker class so we can target print fixes
  clone.classList.add('pdf-capture-root');

  // Convert all images to base64 BEFORE any other processing
  console.log('📷 Converting images to base64 for PDF...');
  await convertImagesToBase64(clone);
  console.log('✅ Images converted to base64');

  // Remove image placeholders and upload/generate buttons before capturing
  const removeImagePlaceholders = (element: HTMLElement) => {
    // First, remove all interactive elements (buttons, file inputs)
    const buttons = element.querySelectorAll('button');
    buttons.forEach(btn => {
      const btnText = btn.textContent || '';
      const btnTitle = btn.getAttribute('title') || '';
      // Remove upload, generate, and remove buttons
      if (btnText.includes('Upload') || btnText.includes('Generate') ||
        btnTitle.includes('Remove') || btnTitle.includes('image')) {
        btn.remove();
      }
    });

    // Remove all file input elements
    const fileInputs = element.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.remove());
  };

  // Clean up placeholders before capturing
  removeImagePlaceholders(clone);

  // Collect CSS from all accessible stylesheets
  let cssText = '';
  const styleSheets = Array.from(document.styleSheets || []);
  for (const sheet of styleSheets) {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        cssText += rule.cssText + '\n';
      }
    } catch (e) {
      // Ignore CORS-restricted stylesheets
    }
  }

  // Add print-specific fixes
  const printFixes = `
    @page { 
      size: A4; 
      margin: 0; 
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body { 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    .page-break { 
      break-after: page !important; 
      page-break-after: always !important; 
      page-break-inside: avoid !important;
    }
    /* Ensure images display properly without borders */
    img {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
      display: block !important;
      border: none !important;
    }
    /* Remove border from image containers */
    img:not([src*="placeholder"]),
    img:not([src="data:image/svg"]) {
      border: none !important;
      outline: none !important;
    }
    /* Remove dashed border from image container divs in PDF */
    .border-dashed,
    [class*="border-dashed"],
    div[style*="border"] img {
      border: none !important;
    }
  `;

  const fullHTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${printFixes}\n${cssText}</style>
  </head>
  <body style="margin: 0; padding: 0;">${clone.outerHTML}</body>
</html>`;

  return fullHTML;
}
