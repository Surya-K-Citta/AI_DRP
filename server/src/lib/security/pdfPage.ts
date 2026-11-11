/**
 * Locks a headless-browser page down before user-influenced HTML is loaded into it.
 * No JavaScript runs, and nothing is fetched from the network or the file system: only inline data: URIs load.
 * That closes server-side request forgery and local file disclosure through <img>, <link>, @import, <iframe> and the like.
 */
type PageLike = {
  setJavaScriptEnabled: (enabled: boolean) => Promise<void>;
  setRequestInterception: (enabled: boolean) => Promise<void>;
  on: (event: 'request', handler: (request: RequestLike) => void) => void;
};
type RequestLike = { url: () => string; abort: (reason?: string) => Promise<void> | void; continue: () => Promise<void> | void };

export function isAllowedPdfRequest(url: string): boolean {
  return url === 'about:blank' || url.startsWith('data:');
}

export async function lockDownPage(page: PageLike, blocked: string[] = []): Promise<void> {
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (isAllowedPdfRequest(url)) {
      void request.continue();
    } else {
      blocked.push(url);
      void request.abort('blockedbyclient');
    }
  });
}
