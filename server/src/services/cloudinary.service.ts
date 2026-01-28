// @ts-nocheck
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    filePath: string,
    folder: string = 'msme-dpr/cluster-images',
    publicId?: string
  ): Promise<{ url: string; publicId: string; secureUrl: string }> {
    try {
      const options: any = {
        folder,
        resource_type: 'image',
        overwrite: true,
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(filePath, options);

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload image from buffer (for generated images)
   */
  static async uploadImageFromBuffer(
    buffer: Buffer,
    folder: string = 'msme-dpr/cluster-images',
    filename?: string
  ): Promise<{ url: string; publicId: string; secureUrl: string }> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            public_id: filename,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                url: result.url,
                secureUrl: result.secure_url,
                publicId: result.public_id,
              });
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error: any) {
      console.error('Error uploading buffer to Cloudinary:', error);
      throw new Error(`Failed to upload image from buffer: ${error.message}`);
    }
  }

  /**
   * Upload image from URL (for AI-generated images)
   */
  static async uploadImageFromUrl(
    imageUrl: string,
    folder: string = 'msme-dpr/cluster-images',
    publicId?: string
  ): Promise<{ url: string; publicId: string; secureUrl: string }> {
    try {
      const options: any = {
        folder,
        resource_type: 'image',
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(imageUrl, options);

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      console.error('Error uploading from URL to Cloudinary:', error);
      throw new Error(`Failed to upload image from URL: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error: any) {
      console.error('Error deleting from Cloudinary:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  static extractPublicId(url: string): string | null {
    try {
      // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        // Remove folder prefix if present
        const publicId = match[1].replace(/^msme-dpr\/cluster-images\//, '');
        return publicId;
      }
      return null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }
}
