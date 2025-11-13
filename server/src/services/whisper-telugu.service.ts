// @ts-nocheck
import { HfInference } from '@huggingface/inference';
import { createWriteStream, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Whisper Telugu Service
 * Uses the fine-tuned Telugu Whisper model from Hugging Face via Inference API
 * Model: vasista22/whisper-telugu-base
 */
export class WhisperTeluguService {
  private static hf: HfInference | null = null;

  /**
   * Initialize Hugging Face Inference client
   */
  private static initialize(): void {
    if (this.hf) {
      return;
    }

    // Initialize with optional API token (for rate limits, but works without too)
    const apiToken = process.env.HUGGINGFACE_API_TOKEN || undefined;
    this.hf = new HfInference(apiToken);
    
    console.log('✅ Hugging Face Inference client initialized');
  }

  /**
   * Convert audio buffer to WAV format using ffmpeg
   * The Whisper model works best with WAV format at 16kHz mono
   */
  private static async convertToWav(
    audioBuffer: Buffer,
    inputFormat: string = 'webm'
  ): Promise<Buffer> {
    const inputPath = join(tmpdir(), `input_${Date.now()}.${inputFormat}`);
    const outputPath = join(tmpdir(), `output_${Date.now()}.wav`);

    try {
      // Write input buffer to temporary file
      const writeStream = createWriteStream(inputPath);
      await new Promise((resolve, reject) => {
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        writeStream.end(audioBuffer);
      });

      // Convert to WAV using ffmpeg
      // Get ffmpeg path from ffmpeg-static
      const ffmpegPath = require('ffmpeg-static');
      
      // Convert to 16kHz mono WAV (Whisper standard format)
      await execAsync(
        `"${ffmpegPath}" -i "${inputPath}" -ar 16000 -ac 1 -f wav "${outputPath}" -y`
      );

      // Read converted WAV file
      const wavBuffer = readFileSync(outputPath);

      // Clean up temporary files
      try {
        unlinkSync(inputPath);
        unlinkSync(outputPath);
      } catch (cleanupError) {
        console.warn('⚠️  Could not clean up temporary files:', cleanupError);
      }

      return wavBuffer;
    } catch (error: any) {
      // Clean up on error
      try {
        if (require('fs').existsSync(inputPath)) unlinkSync(inputPath);
        if (require('fs').existsSync(outputPath)) unlinkSync(outputPath);
      } catch {}

      throw new Error(`Failed to convert audio to WAV: ${error.message}`);
    }
  }

  /**
   * Transcribe Telugu audio using the fine-tuned Whisper model via Hugging Face Inference API
   * @param audioBuffer - Audio file buffer (can be webm, mp3, wav, etc.)
   * @param inputFormat - Input audio format (default: 'webm')
   * @returns Transcribed text in Telugu script
   */
  static async transcribe(
    audioBuffer: Buffer,
    inputFormat: string = 'webm'
  ): Promise<string> {
    try {
      // Initialize if not already done
      this.initialize();

      if (!this.hf) {
        throw new Error('Hugging Face Inference client not initialized');
      }

      console.log('🔄 Converting audio to WAV format (16kHz mono)...');
      
      // Convert audio to WAV format (required for optimal performance)
      const wavBuffer = await this.convertToWav(audioBuffer, inputFormat);

      console.log('🎤 Transcribing Telugu audio using Hugging Face Inference API...');
      console.log('📡 Model: vasista22/whisper-telugu-base');

      // Use Hugging Face Inference API for automatic speech recognition
      // The model is fine-tuned for Telugu, so it will output Telugu script
      // The API accepts Buffer, Blob, or File - try Buffer first (Node.js native)
      let audioData: any = wavBuffer;
      
      // If Blob is available (Node.js 18+), try using it for better compatibility
      try {
        if (typeof Blob !== 'undefined') {
          audioData = new Blob([wavBuffer], { type: 'audio/wav' });
        }
      } catch (e) {
        // Blob not available, use Buffer directly
        audioData = wavBuffer;
      }
      
      const result = await this.hf.automaticSpeechRecognition({
        model: 'vasista22/whisper-telugu-base',
        data: audioData,
      });

      const transcription = result?.text || '';

      if (transcription) {
        console.log(`✅ Telugu transcription completed: ${transcription.substring(0, 100)}...`);
      } else {
        console.warn('⚠️  Transcription returned empty result');
        throw new Error('Transcription returned empty result');
      }

      return transcription;
    } catch (error: any) {
      console.error('❌ Error transcribing Telugu audio:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        throw new Error('Hugging Face API rate limit exceeded. Please try again in a moment or set HUGGINGFACE_API_TOKEN in environment variables.');
      }
      
      throw new Error(`Failed to transcribe Telugu audio: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if the service is initialized
   */
  static isInitialized(): boolean {
    return this.hf !== null;
  }
}
