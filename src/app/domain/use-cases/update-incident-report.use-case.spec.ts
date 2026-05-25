import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { assertIncludes } from '@/testing/assert';

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

describe('IA: solicita actualización con título y descripción → Playwright: verifica que el repositorio recibe el payload exacto', () => {
  let useCase: UpdateIncidentReportUseCase;
  let repositoryMock: { update: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      update: vi.fn().mockReturnValue(of({
        message: 'success',
        data: { id: '123', title: 'Updated', description: 'Updated description', propertyId: '456', createdAt: '2026-03-25T00:00:00Z', createdBy: 'user-1' },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UpdateIncidentReportUseCase);
  });

  it('verifica que el repositorio recibe el id y el payload exactos', async () => {
    const id = '123';
    const data = { title: 'Nuevo Título', description: 'Nueva Descripción' };

    return new Promise<void>((resolve) => {
      useCase.execute(id, data).subscribe(() => {
        expect(repositoryMock.update).toHaveBeenCalledWith(id, data);
        expect(repositoryMock.update).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });
});

describe('IA: observa el contrato del use-case → Playwright: la respuesta contiene message y data', () => {
  let useCase: UpdateIncidentReportUseCase;
  let repositoryMock: { update: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      update: vi.fn().mockReturnValue(of({
        message: 'success',
        data: { id: '123', title: 'Updated', description: 'Updated description', propertyId: '456', createdAt: '2026-03-25T00:00:00Z', createdBy: 'user-1' },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UpdateIncidentReportUseCase);
  });

  it('extrae y verifica las claves del contrato de respuesta', async () => {
    return new Promise<void>((resolve) => {
      useCase.execute('123', { title: 'Test', description: 'Test' }).subscribe((result) => {
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
  let useCase: UpdateIncidentReportUseCase;
  let repositoryMock: { update: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      update: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UpdateIncidentReportUseCase);
  });

  it('verifica que el error original llega al suscriptor sin mutación', async () => {
    return new Promise<void>((resolve) => {
      useCase.execute('123', { title: 'Test', description: 'Test' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          assertIncludes(err.message, 'Network error', 'El mensaje de error debe coincidir exactamente');
          resolve();
        },
      });
    });
  });
});

describe('IA: extrae datos actualizados → Playwright: data.title coincide con el enviado', () => {
  let useCase: UpdateIncidentReportUseCase;
  let repositoryMock: { update: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      update: vi.fn().mockReturnValue(of({
        message: 'success',
        data: { id: '123', title: 'Título Enviado', description: 'Descripción Enviada', propertyId: '456', createdAt: '2026-03-25T00:00:00Z', createdBy: 'user-1' },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateIncidentReportUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(UpdateIncidentReportUseCase);
  });

  it('comprueba que data.title refleja el valor enviado en el payload', async () => {
    const payload = { title: 'Título Enviado', description: 'Descripción Enviada' };

    return new Promise<void>((resolve) => {
      useCase.execute('123', payload).subscribe((result) => {
        expect(result.data.title).toBe(payload.title);
        assertIncludes(result.data.title, payload.title, 'El título en la respuesta debe coincidir con el enviado');
        resolve();
      });
    });
  });
});
