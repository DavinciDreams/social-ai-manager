import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'social-ai-manager-uploads'

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export class CloudStorageService {
  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    folder = 'uploads'
  ): Promise<UploadResult> {
    try {
      const key = `${folder}/${Date.now()}-${fileName}`
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read',
      })

      await s3Client.send(command)

      const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`

      return {
        success: true,
        url,
        key,
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await s3Client.send(command)
      return true
    } catch (error) {
      console.error('S3 delete error:', error)
      return false
    }
  }

  async generatePresignedUrl(
    fileName: string,
    contentType: string,
    folder = 'uploads',
    expiresIn = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = `${folder}/${Date.now()}-${fileName}`
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
    
    return { uploadUrl, key }
  }

  getPublicUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
  }
}

// Fallback to local storage if AWS credentials are not provided
export class LocalStorageService {
  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    folder = 'uploads'
  ): Promise<UploadResult> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const uploadDir = path.join(process.cwd(), 'public', folder)
      
      // Ensure upload directory exists
      try {
        await fs.access(uploadDir)
      } catch {
        await fs.mkdir(uploadDir, { recursive: true })
      }

      const uniqueFileName = `${Date.now()}-${fileName}`
      const filePath = path.join(uploadDir, uniqueFileName)
      
      await fs.writeFile(filePath, file)

      const url = `/${folder}/${uniqueFileName}`

      return {
        success: true,
        url,
        key: uniqueFileName,
      }
    } catch (error) {
      console.error('Local upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async deleteFile(fileName: string, folder = 'uploads'): Promise<boolean> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const filePath = path.join(process.cwd(), 'public', folder, fileName)
      await fs.unlink(filePath)
      return true
    } catch (error) {
      console.error('Local delete error:', error)
      return false
    }
  }
}

// Export the appropriate service based on environment
export const storageService = process.env.AWS_ACCESS_KEY_ID 
  ? new CloudStorageService() 
  : new LocalStorageService()

// export { CloudStorageService, LocalStorageService }
