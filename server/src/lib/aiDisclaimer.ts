// @ts-nocheck
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BorderStyle, Footer, Paragraph, TextRun } from 'docx';

// The same wording is shown in the live preview, the preview page and every downloaded file
// (client copy: client/src/lib/aiDisclaimer.ts).
export const AI_DISCLAIMER_TEXT = 'AI-generated document. It may contain errors, so please double-check all details and figures before you use or submit it.';

const MM = 72 / 25.4;

/**
 * Draws a thin line and the disclaimer at the foot of every page of a PDF, whatever the page size or orientation.
 * The band used is the bottom 8 mm; every document layout keeps at least 12 mm free there.
 * If stamping fails the original file is returned, so a download is never lost over a footer.
 */
export async function stampAiDisclaimer(pdf: Buffer): Promise<Buffer> {
  try {
    const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const ink = rgb(0.29, 0.33, 0.4);
    for (const page of doc.getPages()) {
      const { width } = page.getSize();
      const sideInset = Math.min(16 * MM, width * 0.08);
      const size = 7;
      const baseline = 3 * MM;
      page.drawText(AI_DISCLAIMER_TEXT, { x: sideInset, y: baseline, size, font: regular, color: ink });
      const lineY = baseline + size + 3;
      page.drawLine({ start: { x: sideInset, y: lineY }, end: { x: width - sideInset, y: lineY }, thickness: 0.6, color: rgb(0.45, 0.5, 0.58) });
    }
    return Buffer.from(await doc.save());
  } catch (error: any) {
    console.error('[disclaimer] could not stamp the PDF:', error?.message);
    return pdf;
  }
}

/** Footer for every page of a Word file: a thin line, then the disclaimer. */
export function aiDisclaimerDocxFooters() {
  return {
    default: new Footer({
      children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: '7A8494', space: 4 } },
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: AI_DISCLAIMER_TEXT, size: 14, color: '4A5568' })],
        }),
      ],
    }),
  };
}
