import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { UpdateIncidentReportUseCase } from './update-incident-report.use-case';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import { UpdateIncidentReportRequest, UpdateIncidentReportResponse } from '@/domain/entities/incident-report.model';

describe('UpdateIncidentReportUseCase', () => {
  let useCase: UpdateIncidentReportUseCase;
  let repositoryMock: { update: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockResponse: UpdateIncidentReportResponse = {
      message: 'success',
      data: {
        id: '123',
        title: 'Updated',
        description: 'Updated description',
        propertyId: '456',
        createdAt: '2026-03-25T00:00:00Z',
        createdBy: 'user-1',
      },
    };

    repositoryMock = {
      update: vi.fn().mockReturnValue(of(mockResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UpdateIncidentReportUseCase);
  });

  it('debe llamar al repositorio con id y data correctos', async () => {
    const id = '123';
    const data: UpdateIncidentReportRequest = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    return new Promise((resolve) => {
      useCase.execute(id, data).subscribe(() => {
        expect(repositoryMock.update).toHaveBeenCalledWith(id, data);
        expect(repositoryMock.update).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('debe retornar el observable del repositorio', async () => {
    const mockResponse: UpdateIncidentReportResponse = {
      message: 'success',
      data: {
        id: '123',
        title: 'Updated',
        description: 'Updated description',
        propertyId: '456',
        createdAt: '2026-03-25T00:00:00Z',
        createdBy: 'user-1',
      },
    };

    repositoryMock.update = vi.fn().mockReturnValue(of(mockResponse));

    return new Promise((resolve) => {
      useCase.execute('123', { title: 'Test', description: 'Test' }).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        resolve(true);
      });
    });
  });

  it('debe propagar errores del repositorio', async () => {
    repositoryMock.update = vi.fn().mockReturnValue(throwError(() => new Error('Network error')));

    return new Promise((resolve) => {
      useCase.execute('123', { title: 'Test', description: 'Test' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          resolve(true);
        },
      });
    });
  });
});
