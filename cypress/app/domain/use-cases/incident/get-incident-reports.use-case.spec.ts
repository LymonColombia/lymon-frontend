import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GetIncidentReportsUseCase } from './get-incident-reports.use-case';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import { GetIncidentReportsResponse } from '@/domain/entities/incident-report.model';

describe('GetIncidentReportsUseCase', () => {
  let useCase: GetIncidentReportsUseCase;
  let repositoryMock: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockResponse: GetIncidentReportsResponse = {
      data: [
        {
          id: '1',
          title: 'Leak in kitchen',
          description: 'Pipe leak',
          propertyId: 'prop-123',
          createdAt: '2026-03-25T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };

    repositoryMock = {
      getAll: vi.fn().mockReturnValue(of(mockResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        GetIncidentReportsUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetIncidentReportsUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call repository and return only the data array', async () => {
    const propertyId = 'prop-123';

    return new Promise((resolve) => {
      useCase.execute(propertyId).subscribe((result) => {
        expect(repositoryMock.getAll).toHaveBeenCalledWith(propertyId);
        expect(repositoryMock.getAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
          {
            id: '1',
            title: 'Leak in kitchen',
            description: 'Pipe leak',
            propertyId: 'prop-123',
            createdAt: '2026-03-25T00:00:00Z',
          },
        ]);
        resolve(true);
      });
    });
  });
});
