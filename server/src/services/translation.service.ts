// @ts-nocheck
import { openai } from '../lib/openaiClient';

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
            content: `You are an expert professional translator specializing in English and Telugu translations for business, financial, and technical documents.

CRITICAL TRANSLATION REQUIREMENTS:
1. **Complete Translation**: Translate EVERY word, sentence, and paragraph. Do not skip any content.
2. **Accuracy**: Translate accurately, preserving the exact meaning, context, and tone
3. **Natural Telugu**: Use natural, fluent Telugu that sounds native and professional. Avoid literal word-by-word translations.
4. **Technical Terms**: 
   - For business/financial terms: Use commonly accepted Telugu translations (e.g., "మూలధనం" for capital, "ఆదాయం" for revenue)
   - If English terms are widely used in Telugu business context, you may keep them
5. **Formatting**: Preserve ALL formatting, line breaks, paragraph structure, and markdown markers (###, **) exactly as in the original
6. **Numbers and Currency**: Keep all numbers, dates, percentages, and currency symbols (₹) exactly as they are
7. **Complete Content**: Ensure the translated text is complete - same length and coverage as the original
8. **No Explanations**: Return ONLY the translated text. No explanations, notes, or markdown code blocks.

Translate the following text from ${sourceLangName} to ${targetLangName}. Return the complete translated text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1, // Very low temperature for maximum accuracy
        max_tokens: Math.min(4000, Math.max(1000, text.length * 3)), // More tokens for complete translation
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
   * Translate short pieces of text the person typed (names, descriptions, addresses) to Telugu in one request.
   * Answers come back in the same order. Anything that cannot be translated is returned unchanged, never blank.
   */
  static async translateUserTexts(texts: string[]): Promise<string[]> {
    if (!texts.length) return [];
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You translate short business-form entries from English into natural Telugu for an Indian bank loan report. ' +
              'You receive a JSON array of strings and must return ONLY a JSON array of the same length and order, each item the Telugu translation of the item at that position. ' +
              'Rules: keep numbers, currency symbols, percentages, dates, email addresses, phone numbers and IDs exactly as written; ' +
              'keep proper names of people, businesses and places readable (transliterate them into Telugu script); ' +
              'keep widely used English business words if that is how Telugu speakers write them; ' +
              'preserve line breaks; never add explanations; never return code fences.',
          },
          { role: 'user', content: JSON.stringify(texts) },
        ],
        temperature: 0.1,
        max_tokens: Math.min(8000, Math.max(800, texts.join('').length * 4)),
      });
      const raw = (response.choices[0]?.message?.content || '').trim().replace(/^```(?:json)?|```$/g, '').trim();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length !== texts.length) throw new Error('Unexpected translation shape');
      return parsed.map((item, i) => (typeof item === 'string' && item.trim() ? item : texts[i]));
    } catch (error: any) {
      console.error('User text translation error:', error?.message || error);
      return texts;
    }
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

