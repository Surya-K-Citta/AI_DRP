// The Telugu text (about 1 MB of source) is downloaded only when Telugu is chosen or was the saved choice.
type Dictionary = Record<string, string>;

let dictionary: Dictionary = {};
let pending: Promise<void> | null = null;

export const teluguDictionary = (): Dictionary => dictionary;

export function loadTelugu(i18n: { addResourceBundle: (...args: any[]) => unknown }): Promise<void> {
  pending ||= Promise.all([import('@/lib/i18n/teDictionary'), import('@/i18n/locales/te.json')])
    .then(([dict, locale]) => {
      dictionary = dict.TE;
      i18n.addResourceBundle('te', 'translation', (locale as { default: object }).default, true, true);
    })
    .catch((error) => {
      pending = null; // try again next time
      throw error;
    });
  return pending;
}
