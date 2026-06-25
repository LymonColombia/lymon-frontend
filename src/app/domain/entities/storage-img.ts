import { MediaCategory } from './storage.model';

export interface ImageStorage {
  file: File;
  category: MediaCategory;
}

export type ImageContentType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'application/pdf';

export interface CreatePresignedUrlRequest {
  fileName: string;
  contentType: ImageContentType;
}

export interface PresignedUrlResponse {
  message: string;
  data: {
    presignedUrl?: string;
    key?: string;
    fileUrl: string;
  };
}

export interface UploadedImageResult {
  key: string;
  fileUrl: string;
}
