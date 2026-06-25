import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UploadFileUseCase } from './upload-file.use-case';
import { StorageRepository } from '@/domain/repositories/storage.repository';
import { GetPresignedUrlResponse, UploadedFile } from '@/domain/entities/storage.model';

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;
  let repositoryMock: {
    getPresignedUrl: ReturnType<typeof vi.fn>;
    uploadToPresignedUrl: ReturnType<typeof vi.fn>;
  };

  const PRESIGNED_URL = 'https://r2.example.com/presigned?token=abc123';
  const FILE_URL = 'https://cdn.example.com/uploads/photo.jpg';
  const KEY = 'uploads/photo.jpg';

  const mockPresignedUrlResponse: GetPresignedUrlResponse = {
    presignedUrl: PRESIGNED_URL,
    fileUrl: FILE_URL,
    key: KEY,
  };

  const makeFile = (name = 'photo.jpg', type = 'image/jpeg'): File =>
    new File(['file-content'], name, { type });

  beforeEach(() => {
    repositoryMock = {
      getPresignedUrl: vi.fn().mockReturnValue(of(mockPresignedUrlResponse)),
      uploadToPresignedUrl: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        UploadFileUseCase,
        { provide: StorageRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UploadFileUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute()', () => {
    it('should call getPresignedUrl with the file name and content type', () => {
      return new Promise<void>((resolve) => {
        const file = makeFile('photo.jpg', 'image/jpeg');

        useCase.execute(file, 'experiences').subscribe(() => {
          expect(repositoryMock.getPresignedUrl).toHaveBeenCalledWith({
            fileName: 'photo.jpg',
            contentType: 'image/jpeg',
            category: 'experiences',
          });
          expect(repositoryMock.getPresignedUrl).toHaveBeenCalledTimes(1);
          resolve();
        });
      });
    });

    it('should call uploadToPresignedUrl with the presigned URL and the file', () => {
      return new Promise<void>((resolve) => {
        const file = makeFile('photo.jpg', 'image/jpeg');

        useCase.execute(file, 'experiences').subscribe(() => {
          expect(repositoryMock.uploadToPresignedUrl).toHaveBeenCalledWith(PRESIGNED_URL, file);
          expect(repositoryMock.uploadToPresignedUrl).toHaveBeenCalledTimes(1);
          resolve();
        });
      });
    });

    it('should return an UploadedFile with fileUrl, key, fileName, and contentType', () => {
      return new Promise<void>((resolve) => {
        const file = makeFile('photo.jpg', 'image/jpeg');
        const expected: UploadedFile = {
          fileUrl: FILE_URL,
          key: KEY,
          fileName: 'photo.jpg',
          contentType: 'image/jpeg',
        };

        useCase.execute(file, 'experiences').subscribe((result) => {
          expect(result).toEqual(expected);
          resolve();
        });
      });
    });

    it('should use the file name and content type from the original file, not from the presigned URL response', () => {
      // The UploadedFile.fileName and .contentType must come from the File object, not the server
      return new Promise<void>((resolve) => {
        const file = makeFile('document.pdf', 'application/pdf');

        useCase.execute(file, 'experiences').subscribe((result) => {
          expect(result.fileName).toBe('document.pdf');
          expect(result.contentType).toBe('application/pdf');
          resolve();
        });
      });
    });

    it('should propagate errors from getPresignedUrl without calling uploadToPresignedUrl', () => {
      return new Promise<void>((resolve) => {
        const networkError = new Error('Network error');
        repositoryMock.getPresignedUrl = vi.fn().mockReturnValue(throwError(() => networkError));

        const file = makeFile();

        useCase.execute(file, 'experiences').subscribe({
          error: (err) => {
            expect(err).toBe(networkError);
            expect(repositoryMock.uploadToPresignedUrl).not.toHaveBeenCalled();
            resolve();
          },
        });
      });
    });

    it('should propagate errors from uploadToPresignedUrl', () => {
      return new Promise<void>((resolve) => {
        const uploadError = new Error('Upload failed');
        repositoryMock.uploadToPresignedUrl = vi.fn().mockReturnValue(throwError(() => uploadError));

        const file = makeFile();

        useCase.execute(file, 'experiences').subscribe({
          error: (err) => {
            expect(err).toBe(uploadError);
            expect(repositoryMock.getPresignedUrl).toHaveBeenCalledTimes(1);
            resolve();
          },
        });
      });
    });

    it('should handle a file with a multi-part name and special content type', () => {
      return new Promise<void>((resolve) => {
        const file = makeFile('hotel-report.final.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        useCase.execute(file, 'experiences').subscribe((result) => {
          expect(result.fileName).toBe('hotel-report.final.docx');
          expect(result.contentType).toBe(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          );
          expect(repositoryMock.getPresignedUrl).toHaveBeenCalledWith({
            fileName: 'hotel-report.final.docx',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            category: 'experiences',
          });
          resolve();
        });
      });
    });
  });
});
