import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CreateIncidentReportUseCase } from './create-incident-report.use-case';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import {
  CreateIncidentReportRequest,
  CreateIncidentReportResponse,
} from '@/domain/entities/incident-report.model';

describe('CreateIncidentReportUseCase', () => {
  let useCase: CreateIncidentReportUseCase;
  let repositoryMock: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockResponse: CreateIncidentReportResponse = {
      message: 'Incident report created successfully',
      data: {
        id: '1',
        title: 'Test Incident',
        description: 'Test Description',
        propertyId: 'prop-123',
        createdAt: '2026-03-25T00:00:00Z',
      },
    };

    repositoryMock = {
      create: vi.fn().mockReturnValue(of(mockResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateIncidentReportUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should execute and return the result from the repository', async () => {
    const mockRequest: CreateIncidentReportRequest = {
      title: 'Test Incident',
      description: 'Test Description',
      propertyId: 'prop-123',
    };

    return new Promise((resolve) => {
      useCase.execute(mockRequest).subscribe((result) => {
        expect(result.message).toBe('Incident report created successfully');
        expect(result.data.id).toBe('1');
        expect(repositoryMock.create).toHaveBeenCalledWith(mockRequest);
        expect(repositoryMock.create).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });
});
