export interface GetPresignedUrlResponseDto {
  message: string;
  data: {
    presignedUrl: string;
    fileUrl: string;
    key: string;
  };
}
