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
      
      const result = await OpenAIService.chatResponse(
        message,
        conversationHistory,
        userContext,
        useRAG,
        vectorStoreIds,
        userId
      );

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

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Audio file is required',
        });
        return;
      }

      const transcription = await OpenAIService.transcribeAudio(file.buffer);

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
   * Get multer middleware for file upload
   */
  static getUploadMiddleware() {
    return upload.single('audio');
  }
}

