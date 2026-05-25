import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { assertIncludes } from '@/testing/assert';

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

describe('IA: solicita novedades por propiedad → Playwright: repositorio llamado con propertyId correcto', () => {
  let useCase: GetIncidentReportsUseCase;
  let repositoryMock: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getAll: vi.fn().mockReturnValue(of({
        data: [
          { id: '1', title: 'Leak in kitchen', description: 'Pipe leak', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
        ],
        total: 1,
        page: 1,
        limit: 10,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        GetIncidentReportsUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetIncidentReportsUseCase);
  });

  it('verifica que el repositorio recibe el propertyId exacto', async () => {
    const propertyId = 'prop-123';

    return new Promise<void>((resolve) => {
      useCase.execute(propertyId).subscribe(() => {
        expect(repositoryMock.getAll).toHaveBeenCalledWith(propertyId);
        expect(repositoryMock.getAll).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });
});

describe('IA: extrae lista de resultados → Playwright: array con longitud esperada', () => {
  let useCase: GetIncidentReportsUseCase;
  let repositoryMock: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getAll: vi.fn().mockReturnValue(of({
        data: [
          { id: '1', title: 'Leak in kitchen', description: 'Pipe leak', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
          { id: '2', title: 'Broken window', description: 'Window broken', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        GetIncidentReportsUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetIncidentReportsUseCase);
  });

  it('verifica que el array extraído tiene la longitud esperada', async () => {
    return new Promise<void>((resolve) => {
      useCase.execute('prop-123').subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        resolve();
      });
    });
  });
});

describe('IA: observa respuesta vacía → Playwright: array vacío sin errores', () => {
  let useCase: GetIncidentReportsUseCase;
  let repositoryMock: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getAll: vi.fn().mockReturnValue(of({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        GetIncidentReportsUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetIncidentReportsUseCase);
  });

  it('verifica que una respuesta vacía produce un array vacío', async () => {
    return new Promise<void>((resolve) => {
      useCase.execute('prop-123').subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
        resolve();
      });
    });
  });
});

describe('IA: extrae estructura del primer reporte → Playwright: contiene title, description, propertyId', () => {
  let useCase: GetIncidentReportsUseCase;
  let repositoryMock: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getAll: vi.fn().mockReturnValue(of({
        data: [
          { id: '1', title: 'Leak in kitchen', description: 'Pipe leak', propertyId: 'prop-123', createdAt: '2026-03-25T00:00:00Z' },
        ],
        total: 1,
        page: 1,
        limit: 10,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        GetIncidentReportsUseCase,
        { provide: IncidentReportRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetIncidentReportsUseCase);
  });

  it('verifica que el primer elemento contiene las claves esperadas', async () => {
    return new Promise<void>((resolve) => {
      useCase.execute('prop-123').subscribe((result) => {
        const first = result[0];
        const expectedSchema = ['title', 'description', 'propertyId'];
        const actualKeys = Object.keys(first);
        expectedSchema.forEach((key) => {
          assertIncludes(actualKeys.join(','), key, `El primer reporte debe incluir la clave "${key}"`);
        });
        resolve();
      });
    });
  });
});
