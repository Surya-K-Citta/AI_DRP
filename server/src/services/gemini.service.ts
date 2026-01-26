// @ts-nocheck
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('❌ OPENAI_API_KEY is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class GeminiService {
  /**
   * Enhance prompt to enforce realistic, professional imagery
   */
  private static enhancePromptForRealism(basePrompt: string, sectionInfo?: any): string {
    return `
Create a documentary-style image suitable for a government or corporate Detailed Project Report (DPR).

Scene description:
${basePrompt}

Requirements:
- Natural daylight and realistic lighting
- Accurate scale, proportions, and spacing
- No humans, animals, or any living beings
- Absolutely no text, labels, diagrams, or watermarks visible anywhere

Strictly avoid:
- Illustrations, concept art, cinematic or dramatic lighting
- Unrealistic symmetry or exaggerated scale
- Artistic, futuristic, or AI-generated visual styles

The final image must look fully realistic and professional, as if photographed for an official DPR or feasibility report.
    `.trim();
  }

  /**
   * Generate a professional manufacturing / infrastructure image
   */
  static async generateImage(
    basePrompt: string,
    sectionInfo?: any
  ): Promise<string> {
    try {
      // ✅ Enhance prompt for realism
      const enhancedPrompt = this.enhancePromptForRealism(basePrompt, sectionInfo);

      console.log('🎨 GENERATING IMAGE WITH PROMPT:\n', enhancedPrompt);

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const imageUrl = response.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      console.log('✅ Image generated successfully');
      return imageUrl;
    } catch (error: any) {
      console.error('❌ Image generation failed:', error);
      throw error;
    }
  }
}
