import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class TranslationService {
  /**
   * Translate text using OpenAI (more reliable than Google Translate)
   */
  static async translateText(
    text: string,
    targetLanguage: 'en' | 'te'
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    try {
      const targetLangName = targetLanguage === 'te' ? 'Telugu' : 'English';
      const sourceLangName = targetLanguage === 'te' ? 'English' : 'Telugu';

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Maintain the original formatting, structure, and meaning. Return only the translated text without any explanations or additional text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const translatedText = response.choices[0]?.message?.content?.trim() || text;
      return translatedText;
    } catch (error: any) {
      console.error('Translation error:', error);
      // Fallback: return original text if translation fails
      return text;
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

