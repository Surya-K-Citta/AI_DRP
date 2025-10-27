import axios from 'axios';

export class TranslationService {
  /**
   * Translate text using Google Translate API
   */
  static async translateText(
    text: string,
    targetLanguage: 'en' | 'te'
  ): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      console.warn('Google Translate API key not configured, returning original text');
      return text;
    }

    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {},
        {
          params: {
            q: text,
            target: targetLanguage,
            key: apiKey,
          },
        }
      );

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Batch translate multiple texts
   */
  static async translateBatch(
    texts: string[],
    targetLanguage: 'en' | 'te'
  ): Promise<string[]> {
    const promises = texts.map((text) =>
      this.translateText(text, targetLanguage)
    );
    return Promise.all(promises);
  }

  /**
   * Translate DPR content object
   */
  static async translateDPRContent(
    content: any,
    targetLanguage: 'en' | 'te'
  ): Promise<any> {
    const translated: any = {};

    for (const key in content) {
      if (typeof content[key] === 'string') {
        translated[key] = await this.translateText(content[key], targetLanguage);
      } else if (typeof content[key] === 'object') {
        translated[key] = await this.translateDPRContent(
          content[key],
          targetLanguage
        );
      } else {
        translated[key] = content[key];
      }
    }

    return translated;
  }
}

