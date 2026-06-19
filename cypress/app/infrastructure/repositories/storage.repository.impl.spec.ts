import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { StorageRepositoryImpl } from './storage.repository.impl';
import { environment } from '@env';
import { GetPresignedUrlRequest, GetPresignedUrlResponse } from '@/domain/entities/storage.model';
import { GetPresignedUrlResponseDto } from '@/infrastructure/dtos/storage.dto';

const PRESIGNED_URL_ENDPOINT = `${environment.apiUrl}${environment.storage.endpoint}`;

describe('StorageRepositoryImpl', () => {
  let repository: StorageRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(StorageRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPresignedUrl()', () => {
    const request: GetPresignedUrlRequest = {
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    };

    const mockDto: GetPresignedUrlResponseDto = {
      message: 'Presigned URL generated',
      data: {
        presignedUrl: 'https://r2.example.com/presigned?token=abc123',
        fileUrl: 'https://cdn.example.com/uploads/photo.jpg',
        key: 'uploads/photo.jpg',
      },
    };

    it('should POST to the storage endpoint with the request body', () => {
      repository.getPresignedUrl(request).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockDto);
    });

    it('should map the response DTO data field to a GetPresignedUrlResponse', () => {
      const expected: GetPresignedUrlResponse = {
        presignedUrl: mockDto.data.presignedUrl,
        fileUrl: mockDto.data.fileUrl,
        key: mockDto.data.key,
      };

      repository.getPresignedUrl(request).subscribe((response) => {
        expect(response).toEqual(expected);
      });

      const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
      req.flush(mockDto);
    });

    it('should not expose the message wrapper field from the DTO', () => {
      repository.getPresignedUrl(request).subscribe((response) => {
        expect((response as unknown as Record<string, unknown>)['message']).toBeUndefined();
      });

      const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
      req.flush(mockDto);
    });

    it('should propagate HTTP errors from the server', () => {
      return new Promise<void>((resolve) => {
        repository.getPresignedUrl(request).subscribe({
          error: (err) => {
            expect(err.status).toBe(500);
            resolve();
          },
        });

        const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
        req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
      });
    });

    it('should propagate 401 Unauthorized errors from the server', () => {
      return new Promise<void>((resolve) => {
        repository.getPresignedUrl(request).subscribe({
          error: (err) => {
            expect(err.status).toBe(401);
            resolve();
          },
        });

        const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      });
    });
  });

  describe('uploadToPresignedUrl()', () => {
    const PRESIGNED_URL = 'https://r2.example.com/bucket/uploads/photo.jpg?X-Amz-Signature=abc';

    const makeFile = (name = 'photo.jpg', type = 'image/jpeg'): File =>
      new File(['file-content'], name, { type });

    it('should PUT the file to the presigned URL', () => {
      const file = makeFile();

      repository.uploadToPresignedUrl(PRESIGNED_URL, file).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL);
      expect(req.request.method).toBe('PUT');
      req.flush(null);
    });

    it('should send the file as the PUT request body', () => {
      const file = makeFile();

      repository.uploadToPresignedUrl(PRESIGNED_URL, file).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL);
      expect(req.request.body).toBe(file);
      req.flush(null);
    });

    it('should set the Content-Type header to the file MIME type', () => {
      const file = makeFile('photo.jpg', 'image/jpeg');

      repository.uploadToPresignedUrl(PRESIGNED_URL, file).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL);
      expect(req.request.headers.get('Content-Type')).toBe('image/jpeg');
      req.flush(null);
    });

    it('should set the correct Content-Type header for non-image files', () => {
      const file = makeFile('document.pdf', 'application/pdf');

      repository.uploadToPresignedUrl(PRESIGNED_URL, file).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL);
      expect(req.request.headers.get('Content-Type')).toBe('application/pdf');
      req.flush(null);
    });

    it('should NOT send an Authorization header in the R2 PUT request', () => {
      // R2 presigned URLs must not include the app Authorization token.
      // The impl uses HttpBackend directly to bypass auth interceptors.
      const file = makeFile();

      repository.uploadToPresignedUrl(PRESIGNED_URL, file).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush(null);
    });

    it('should propagate upload errors from the presigned URL endpoint', () => {
      return new Promise<void>((resolve) => {
        const file = makeFile();

        repository.uploadToPresignedUrl(PRESIGNED_URL, file).subscribe({
          error: (err) => {
            expect(err.status).toBe(403);
            resolve();
          },
        });

        const req = httpMock.expectOne(PRESIGNED_URL);
        req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      });
    });
  });
});
