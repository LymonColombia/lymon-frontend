export type MediaCategory = 'experiences' | 'units' | 'properties';

export interface GetPresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
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

/**
 * A media item the client tracks while editing: the object `key` needed for
 * writes, paired with the public `url` returned by reads for display.
 */
export interface MediaItem {
  key: string;
  url: string;
}

// ponytail: assumes public URL is <host>/<key>; pathname minus leading slash == object key
export const keyFromMediaUrl = (url: string): string => new URL(url).pathname.slice(1);

