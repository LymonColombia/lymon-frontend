export type MediaCategory = 'experiences' | 'units' | 'properties';

export interface GetPresignedUrlRequest {
  fileName: string;
  contentType: string;
  category: MediaCategory;
}

export interface GetPresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
  key: string;
}

export interface UploadedFile {
  fileUrl: string;
  key: string;
  fileName: string;
  contentType: string;
}

