import { Response } from 'express';
import { AuthRequest } from '../types';
import { OpenAIService } from '../services/openai.service';
import multer from 'multer';

// Setup multer for audio file uploads
const upload = multer({ storage: multer.memoryStorage() });

export class AIController {
  /**
   * Chat with AI assistant (supports RAG)
   */
  static async chat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        message,
        conversationHistory = [],
        userContext,
        useRAG = false,
        vectorStoreIds
      } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          message: 'Message is required',
        });
        return;
      }

      const userId = req.user?.userId || req.user?._id?.toString();
      
      // Get AI response first - this is critical and must succeed
      let result;
      try {
        result = await OpenAIService.chatResponse(
          message,
          conversationHistory,
          userContext,
          useRAG,
          vectorStoreIds,
          userId
        );
      } catch (error: any) {
        console.error('❌ Error getting AI response:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get response from AI',
          error: error.message,
        });
        return;
      }

      // Check if PDF generation is requested
      // IMPORTANT: PDF generation failure should NOT break the AI response
      let pdfUrl: string | undefined;
      if (result.generatePDF) {
        console.log('📄 PDF generation requested, starting generation...');
        console.log(`📊 Conversation history length: ${conversationHistory.length} messages`);
        console.log(`📊 Conversation data from result: ${result.conversationData ? result.conversationData.length : 0} characters`);
        
        // Generate PDF from conversation data
        // Wrap in try-catch to ensure PDF failure doesn't break response
        try {
          // Import OpenAIService to access static method
          const { OpenAIService } = await import('../services/openai.service');
          
          // Extract conversation data if not already extracted
          let pdfData = result.conversationData;
          
          if (!pdfData || pdfData.length === 0) {
            console.log('📊 Extracting conversation data for PDF...');
            // Extract all user messages from conversation
            const userMessages = conversationHistory.filter(msg => msg.role === 'user');
            console.log(`📊 Found ${userMessages.length} user messages`);
            
            if (userMessages.length > 0) {
              pdfData = userMessages
                .map((msg, idx) => {
                  if (msg.content && msg.content.length > 5) {
                    return `[Entry ${idx + 1}]: ${msg.content}`;
                  }
                  return null;
                })
                .filter((entry: string | null) => entry !== null)
                .join('\n\n');
              
              console.log(`📊 Extracted PDF data: ${pdfData.length} characters`);
            } else {
              console.warn('⚠️  No user messages found in conversation history');
            }
          }
          
          if (pdfData && pdfData.length > 0) {
            const entryCount = (pdfData.match(/\[Entry/g) || []).length;
            console.log(`📄 Generating PDF from ${entryCount} data entries (${pdfData.length} characters)...`);
            
            // Add timeout to PDF generation (30 seconds max)
            const pdfGenerationPromise = OpenAIService.generatePDFFromConversation(
              pdfData,
              conversationHistory,
              userId
            );
            
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('PDF generation timeout after 30 seconds')), 30000);
            });
            
            const pdfBuffer = await Promise.race([pdfGenerationPromise, timeoutPromise]);
            
            // Convert to base64 data URL
            const pdfBase64 = pdfBuffer.toString('base64');
            pdfUrl = `data:application/pdf;base64,${pdfBase64}`;
            
            console.log(`✅ PDF generated successfully (${Math.round(pdfBuffer.length / 1024)}KB)`);
          } else {
            console.warn('⚠️  PDF requested but no conversation data available');
            console.warn(`   - pdfData exists: ${!!pdfData}`);
            console.warn(`   - pdfData length: ${pdfData?.length || 0}`);
            // Still set generatePDF flag so frontend knows it was requested
          }
        } catch (error: any) {
          // CRITICAL: Log error but continue with AI response
          console.error('❌ Error generating PDF (non-critical):', error);
          console.error('Error message:', error.message);
          console.error('Error name:', error.name);
          console.error('Error stack:', error.stack);
          
          // Log additional context
          if (error.message?.includes('timeout')) {
            console.error('⏱️  PDF generation timed out - this may indicate a performance issue');
          }
          if (error.message?.includes('PDFDocument')) {
            console.error('📄 PDFDocument error - check if pdfkit is properly installed');
          }
          
          // Continue without PDF - AI response is more important
          // Frontend will handle missing PDF gracefully
        }
      }

      // Log PDF generation status for debugging
      if (result.generatePDF) {
        console.log(`📄 PDF generation status: ${pdfUrl ? 'SUCCESS' : 'FAILED'}`);
        if (!pdfUrl) {
          console.warn('⚠️  PDF was requested but not generated. Check server logs for errors.');
        }
      }

      res.status(200).json({
        success: true,
        data: {
          response: result.response,
          suggestions: result.suggestions,
          nextSteps: result.nextSteps,
          ragContext: result.ragContext,
          dprAction: result.dprAction,
          dprQuestions: result.dprQuestions,
          templateStructure: result.templateStructure,
          generatePDF: result.generatePDF || false,
          pdfUrl: pdfUrl || undefined,
          fullDataRequested: result.fullDataRequested || false,
          allUserData: result.allUserData || undefined,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat',
        error: error.message,
      });
    }
  }

  /**
   * Transcribe audio using Whisper
   */
  static async transcribe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { language } = req.body; // 'en' for English, 'te' for Telugu

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Audio file is required',
        });
        return;
      }

      const transcription = await OpenAIService.transcribeAudio(
        file.buffer,
        language as 'en' | 'te' | undefined
      );

      res.status(200).json({
        success: true,
        data: {
          transcription,
        },
      });
    } catch (error: any) {
      console.error('Transcribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transcribe audio',
        error: error.message,
      });
    }
  }

  /**
   * Generate speech from text using OpenAI TTS
   */
  static async textToSpeech(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { text, language, voice } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          message: 'Text is required',
        });
        return;
      }

      const audioBuffer = await OpenAIService.textToSpeech(
        text,
        (language as 'en' | 'te') || 'en',
        (voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') || 'alloy'
      );

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.status(200).send(audioBuffer);
    } catch (error: any) {
      console.error('TTS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate speech',
        error: error.message,
      });
    }
  }

  /**
   * Get multer middleware for file upload
   */
  static getUploadMiddleware() {
    return upload.single('audio');
  }
}

