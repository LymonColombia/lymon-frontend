export interface GetPresignedUrlRequest {
  fileName: string;
  contentType: string;
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

