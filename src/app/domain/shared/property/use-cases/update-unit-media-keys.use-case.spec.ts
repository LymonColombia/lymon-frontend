import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UpdateUnitMediaKeysUseCase } from './update-unit-media-keys.use-case';
import { PropertyRepository } from '@/domain/shared/property/property.repository';

describe('UpdateUnitMediaKeysUseCase', () => {
  let useCase: UpdateUnitMediaKeysUseCase;
  let repositoryMock: {
    updateUnitMediaKeys: ReturnType<typeof vi.fn>;
  };

  const UNIT_ID = 'unit-abc-123';
  const MEDIA_KEYS = ['uploads/room-1.jpg', 'uploads/room-2.jpg', 'uploads/room-3.jpg'];

  beforeEach(() => {
    repositoryMock = {
      updateUnitMediaKeys: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateUnitMediaKeysUseCase,
        { provide: PropertyRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UpdateUnitMediaKeysUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute()', () => {
    it('should call updateUnitMediaKeys with the unitId and a wrapped DTO', () => {
      return new Promise<void>((resolve) => {
        useCase.execute(UNIT_ID, MEDIA_KEYS).subscribe(() => {
          expect(repositoryMock.updateUnitMediaKeys).toHaveBeenCalledWith(UNIT_ID, {
            mediaKeys: MEDIA_KEYS,
          });
          expect(repositoryMock.updateUnitMediaKeys).toHaveBeenCalledTimes(1);
          resolve();
        });
      });
    });

    it('should wrap the mediaKeys array inside a DTO object, not pass the array directly', () => {
      return new Promise<void>((resolve) => {
        useCase.execute(UNIT_ID, MEDIA_KEYS).subscribe(() => {
          const [, secondArg] = repositoryMock.updateUnitMediaKeys.mock.calls[0];
          expect(secondArg).toEqual({ mediaKeys: MEDIA_KEYS });
          expect(Array.isArray(secondArg)).toBe(false);
          resolve();
        });
      });
    });

    it('should pass the unitId as the first argument unchanged', () => {
      return new Promise<void>((resolve) => {
        const specificUnitId = 'unit-xyz-999';

        useCase.execute(specificUnitId, MEDIA_KEYS).subscribe(() => {
          const [firstArg] = repositoryMock.updateUnitMediaKeys.mock.calls[0];
          expect(firstArg).toBe(specificUnitId);
          resolve();
        });
      });
    });

    it('should work with an empty mediaKeys array', () => {
      return new Promise<void>((resolve) => {
        useCase.execute(UNIT_ID, []).subscribe(() => {
          expect(repositoryMock.updateUnitMediaKeys).toHaveBeenCalledWith(UNIT_ID, {
            mediaKeys: [],
          });
          resolve();
        });
      });
    });

    it('should work with a single media key', () => {
      return new Promise<void>((resolve) => {
        const singleKey = ['uploads/cover.jpg'];

        useCase.execute(UNIT_ID, singleKey).subscribe(() => {
          expect(repositoryMock.updateUnitMediaKeys).toHaveBeenCalledWith(UNIT_ID, {
            mediaKeys: singleKey,
          });
          resolve();
        });
      });
    });

    it('should propagate errors from the repository', () => {
      return new Promise<void>((resolve) => {
        const repoError = new Error('Repository unavailable');
        repositoryMock.updateUnitMediaKeys = vi
          .fn()
          .mockReturnValue(throwError(() => repoError));

        useCase.execute(UNIT_ID, MEDIA_KEYS).subscribe({
          error: (err) => {
            expect(err).toBe(repoError);
            resolve();
          },
        });
      });
    });

    it('should not suppress the error — observable must error, not complete silently', () => {
      return new Promise<void>((resolve) => {
        const repoError = new Error('Network failure');
        repositoryMock.updateUnitMediaKeys = vi
          .fn()
          .mockReturnValue(throwError(() => repoError));

        let completed = false;

        useCase.execute(UNIT_ID, MEDIA_KEYS).subscribe({
          complete: () => {
            completed = true;
          },
          error: () => {
            expect(completed).toBe(false);
            resolve();
          },
        });
      });
    });
  });
});
