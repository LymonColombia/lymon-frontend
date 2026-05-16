export interface ImageStorage {
  file: File;
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
    uploadUrl?: string;
    presignedUrl?: string;
    objectKey?: string;
    key?: string;
    fileUrl?: string;
  };
}

export interface UploadedImageResult {
  objectKey: string;
  fileUrl?: string;
}
