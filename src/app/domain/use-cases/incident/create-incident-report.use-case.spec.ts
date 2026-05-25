import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { assertIncludes } from '@/testing/assert';

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

describe('IA: solicita creación de reporte con título, descripción y propiedad → Playwright: verifica que el repositorio recibe el payload exacto', () => {
  let useCase: CreateIncidentReportUseCase;
  let repositoryMock: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      create: vi.fn().mockReturnValue(of({
        message: 'Incident report created successfully',
        data: { id: '1', title: 'Test Incident', description: 'Test Description', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateIncidentReportUseCase);
  });

  it('verifica que el repositorio recibe el payload exacto', async () => {
    const payload: CreateIncidentReportRequest = {
      title: 'Test Incident',
      description: 'Test Description',
      propertyId: 'prop-123',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe(() => {
        expect(repositoryMock.create).toHaveBeenCalledWith(payload);
        expect(repositoryMock.create).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });
});

describe('IA: observa el contrato del use-case → Playwright: la respuesta contiene message y data', () => {
  let useCase: CreateIncidentReportUseCase;
  let repositoryMock: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      create: vi.fn().mockReturnValue(of({
        message: 'Incident report created successfully',
        data: { id: '1', title: 'Test Incident', description: 'Test Description', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateIncidentReportUseCase);
  });

  it('extrae y verifica las claves del contrato de respuesta', async () => {
    const payload: CreateIncidentReportRequest = {
      title: 'Test Incident',
      description: 'Test Description',
      propertyId: 'prop-123',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe((result) => {
        const expectedSchema = ['message', 'data'];
        const actualKeys = Object.keys(result);
        expectedSchema.forEach((key) => {
          assertIncludes(actualKeys.join(','), key, `La respuesta debe incluir la clave "${key}"`);
        });
        resolve();
      });
    });
  });
});

describe('IA: extrae estructura de error → Playwright: el error se propaga sin transformar', () => {
  let useCase: CreateIncidentReportUseCase;
  let repositoryMock: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      create: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateIncidentReportUseCase);
  });

  it('verifica que el error original llega al suscriptor sin mutación', async () => {
    const payload: CreateIncidentReportRequest = {
      title: 'Test Incident',
      description: 'Test Description',
      propertyId: 'prop-123',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          assertIncludes(err.message, 'Network error', 'El mensaje de error debe coincidir exactamente');
          resolve();
        },
      });
    });
  });
});

describe('IA: extrae datos creados → Playwright: data.title coincide con el enviado', () => {
  let useCase: CreateIncidentReportUseCase;
  let repositoryMock: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      create: vi.fn().mockReturnValue(of({
        message: 'Incident report created successfully',
        data: { id: '1', title: 'Título Enviado', description: 'Descripción Enviada', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateIncidentReportUseCase);
  });

  it('comprueba que data.title refleja el valor enviado en el payload', async () => {
    const payload: CreateIncidentReportRequest = {
      title: 'Título Enviado',
      description: 'Descripción Enviada',
      propertyId: 'prop-123',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe((result) => {
        expect(result.data.title).toBe(payload.title);
        assertIncludes(result.data.title, payload.title, 'El título en la respuesta debe coincidir con el enviado');
        resolve();
      });
    });
  });
});
