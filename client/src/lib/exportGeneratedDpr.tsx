import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { api } from '@/lib/api';
import { IndividualDPRDocumentView } from '@/components/individual-dpr/IndividualDPRDocumentView';
import { PageSheet } from '@/components/individual-dpr/PageSheet';
import { extractIndividualDocData, extractSchemeCode } from '@/lib/individualDpr/individualDocModel';
import { pageEdgeMm, resolveDocumentStyle } from '@/lib/individualDpr/documentStyle';
import { captureElementAsStandaloneHTML } from '@/lib/htmlCapture';
import { dprDownloadName } from '@/lib/dprExportName';
import { dprSchemeCode } from '@/lib/dprSearchTags';

export type ExportFormat = 'pdf' | 'docx';
export type ExportedFile = { blob: Blob; filename: string; format: ExportFormat };

const unwrap = (response: any) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
  if (Array.isArray(response?.data)) return response.data[0] || response;
  return response;
};
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const cancelled = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
};

/**
 * Makes the PDF or Word file of a generated Latest (individual) DPR without opening the view page. The report is drawn
 * off screen exactly as the view page draws it, in its own English i18n instance (exports are English only, and the app's
 * own language and heavy form are not touched). The PDF is printed by the server from that page's HTML, as on the view page;
 * the Word file is built right here in the browser from the same page, so it does not depend on the server version.
 */
export async function exportGeneratedDpr(dprId: string, format: ExportFormat, signal?: AbortSignal): Promise<ExportedFile> {
  const dpr = unwrap(await api.getDPR(dprId));
  let project: any = dpr?.projectId && typeof dpr.projectId === 'object' ? dpr.projectId : null;
  if (!project && dpr?.projectId) {
    try {
      const projectResponse = await api.getProject(dpr.projectId);
      project = projectResponse.data || projectResponse;
    } catch {
      project = null;
    }
  }
  cancelled(signal);

  const english = i18n.cloneInstance({ lng: 'en' });
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:21cm;pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const record = extractIndividualDocData(dpr, project);
    const saved = record?.schemeExtras?.documentStyle;
    const look = saved ? resolveDocumentStyle(saved, extractSchemeCode(dpr, project, record)) : null;
    const doc = <IndividualDPRDocumentView dpr={dpr} project={project} viewLanguage="english" />;
    root.render(
      <I18nextProvider i18n={english}>
        {look ? (
          <PageSheet className="bg-white mx-auto" pageSize={look.pageSize} edgeTopMm={pageEdgeMm(look.marginMm.top)} edgeBottomMm={pageEdgeMm(look.marginMm.bottom)}>
            {doc}
          </PageSheet>
        ) : (
          <div className="bg-white mx-auto" style={{ width: '21cm', minHeight: '29.7cm', padding: '2rem' }}>
            {doc}
          </div>
        )}
      </I18nextProvider>
    );
    for (let i = 0; i < 60 && !host.querySelector('.dpr-document'); i += 1) await wait(50);
    const element = host.querySelector('.dpr-document');
    if (!element) throw new Error('The report could not be drawn for export');
    await nextFrame();
    await wait(look ? 600 : 150);
    // Pictures (loaded with the person's sign-in) must be in before the file is made.
    for (let i = 0; i < 40 && Array.from(element.querySelectorAll('img')).some((img) => !(img as HTMLImageElement).complete); i += 1) await wait(100);
    cancelled(signal);

    let blob: Blob;
    if (format === 'pdf') {
      const html = captureElementAsStandaloneHTML(element);
      try {
        blob = await api.downloadPDFExactFromHTML(dprId, html, 'english', signal);
      } catch (error: any) {
        if (signal?.aborted) throw error;
        console.warn('PDF from the page failed, using the server PDF', error?.response?.status || error?.message);
        blob = await api.downloadPDF(dprId, 'english', undefined, signal);
      }
    } else {
      try {
        const { domToDocxBlob } = await import('@/lib/domToDocx');
        blob = await domToDocxBlob(element);
      } catch (error: any) {
        console.warn('Word file from the page failed in the browser, trying the server', error?.message);
        blob = await api.downloadDOCXExactFromHTML(dprId, captureElementAsStandaloneHTML(element), 'english', signal);
      }
    }
    cancelled(signal);
    if (!blob || blob.size < 100) throw new Error('The file came back empty');
    const filename = dprDownloadName({ schemeCode: dprSchemeCode(dpr), projectName: project?.projectName, language: 'english', ext: format === 'pdf' ? 'pdf' : 'docx' });
    return { blob, filename, format };
  } finally {
    root.unmount();
    host.remove();
  }
}
