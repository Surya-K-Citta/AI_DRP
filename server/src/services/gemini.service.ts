// // @ts-nocheck
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import OpenAI from 'openai';
// import dotenv from 'dotenv';

// dotenv.config();

// if (!process.env.GEMINI_API_KEY) {
//   console.warn('⚠️ WARNING: GEMINI_API_KEY environment variable is not set. Image generation will not work.');
// }

// const genAI = process.env.GEMINI_API_KEY 
//   ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
//   : null;

// const openai = process.env.OPENAI_API_KEY
//   ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
//   : null;

// export class GeminiService {
//   /**
//    * Generate an image using Gemini-enhanced prompt with DALL-E
//    */  
//   static async generateImage(
//     prompt: string,
//     sectionInfo: any
//   ): Promise<string> {
//     try {
//       // Step 1: Use Gemini to enhance the prompt based on DPR section information
//       let enhancedPrompt = prompt;
      
//       if (genAI) {
//         const model = genAI.getGenerativeModel({ model: 'gemini-1.5' });
//         enhancedPrompt = await this.createImagePrompt(prompt, sectionInfo, model);
//       }
      
//       // Step 2: Use DALL-E to generate the actual image
//       if (!openai) {
//         throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
//       }

//       console.log(`🎨 Generating image with prompt: ${enhancedPrompt}`);
      
//       const response = await openai.images.generate({
//         model: 'dall-e-3',
//         prompt: enhancedPrompt,
//         n: 1,
//         size: '1024x1024',
//         quality: 'hd',
//         response_format: 'url',
//       });

//       const imageUrl = response.data[0]?.url;
      
//       if (!imageUrl) {
//         throw new Error('Failed to generate image: No URL returned from DALL-E');
//       }

//       console.log('✅ Image generated successfully');
//       return imageUrl;
//     } catch (error: any) {
//       console.error('Error generating image:', error);
//       throw new Error(`Failed to generate image: ${error.message}`);
//     }
//   }

//   /**
//    * Create an enhanced image generation prompt based on section information
//    */
//   private static async createImagePrompt(
//     basePrompt: string,
//     sectionInfo: any,
//     model: any
//   ): Promise<string> {
//     try {
// //       const contextPrompt = `
// // You are an expert at creating detailed image generation prompts. Based on the following DPR section information, create a comprehensive, detailed prompt for generating a professional, realistic image suitable for a business document.

// // DPR Section Information:
// // ${JSON.stringify(sectionInfo, null, 2)}

// // Base Prompt: ${basePrompt}

// // Create a detailed image generation prompt that:
// // 1. Describes the scene accurately based on the DPR information
// // 2. Includes relevant details about the cluster, products, processes, or facilities mentioned
// // 3. Is professional and suitable for a business document (Detailed Project Report)
// // 4. Is specific enough for high-quality image generation
// // 5. Focuses on realistic, documentary-style imagery
// // 6. Avoids any text or labels in the image
// // 7. Uses professional photography style

// // Return only the enhanced prompt, nothing else. Do not include any explanations or additional text.
// // `;

// const contextPrompt = `
// You are a senior visual prompt engineer specializing in professional, photorealistic imagery for business, infrastructure, and industrial documentation.

// Your task is to generate a single, highly detailed image generation prompt based on the following inputs.

// DPR Section Information:
// ${JSON.stringify(sectionInfo, null, 2)}

// Base Prompt:
// ${basePrompt}

// Your generated image prompt must:
// - Be strictly realistic and documentary in nature
// - Match real-world photography standards used in corporate reports and government DPRs
// - Accurately reflect the infrastructure, facilities, machinery, processes, scale, and environment described in the DPR section
// - Be specific about setting, materials, spatial layout, lighting conditions, camera angle, and level of detail
// - Avoid any artistic exaggeration, stylization, fantasy, or illustrative elements

// CRITICAL RULES:
// - If humans appear, they must be:
//   - Clearly and sharply rendered with correct anatomy and natural proportions
//   - Free from blur, distortion, abstraction, or AI artifacts
//   - Professionally dressed and engaged in contextually relevant activities
//   - Realistic in posture, expression, and interaction with the environment
// - All machinery, tools, buildings, and industrial elements must appear functional, real, and industry-accurate
// - Use natural daylight or realistic industrial lighting only (no cinematic, dramatic, or stylized lighting)
// - The final image must appear as if captured by a professional photographer for a formal business or government report

// Output ONLY the final enhanced image generation prompt.
// Do not include explanations, formatting, headings, or any additional text.
// `;


//       const result = await model.generateContent(contextPrompt);
//       const response = await result.response;
//       const enhancedPrompt = response.text();
      
//       return enhancedPrompt.trim();
//     } catch (error: any) {
//       console.error('Error creating enhanced prompt with Gemini:', error);
//       // Fallback to base prompt if Gemini fails
//       return basePrompt;
//     }
//   }
// }


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
   * Generate a professional manufacturing process diagram image
   */
  static async generateImage(
    basePrompt: string,
    sectionInfo: any
  ): Promise<string> {
    try {
      // Use the base prompt directly - simple and effective
      console.log('🎨 GENERATING IMAGE WITH PROMPT:\n', basePrompt);

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: basePrompt,
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
