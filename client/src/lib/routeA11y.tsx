import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SITE = 'MSME DPR Tool';

/**
 * When the page changes (the app never reloads), people using a keyboard or a screen reader need to be told:
 *  - the browser tab gets a title that names the page (taken from its main heading, so it follows the language);
 *  - focus moves to the start of the new page's content, which a screen reader then reads, instead of staying on the link that was used.
 * Changing only the query string or hash (for example the step in a form) does neither.
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const first = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const heading = document.querySelector('main h1, h1')?.textContent?.trim();
      document.title = heading ? `${heading} · ${SITE}` : SITE;
      if (first.current) {
        first.current = false;
        return;
      }
      const main = document.getElementById('main-content') || document.getElementById('main');
      if (main) {
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pathname, i18n.language]);

  return null;
}
