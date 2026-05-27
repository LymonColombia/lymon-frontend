import { CrmMapper } from './crm.mapper';
import { CrmGuestBookingOriginsResponseDto, CrmGuestRatingsResponseDto } from '@/infrastructure/dtos/crm.dto';

describe('CrmMapper.toGuestRatings', () => {
  const buildDto = (overrides?: Partial<CrmGuestRatingsResponseDto>): CrmGuestRatingsResponseDto => ({
    items: [
      {
        id: 'rating-1',
        unitId: 'unit-abc',
        unitName: 'Suite deluxe',
        rate: 4,
        message: 'Excelente estancia',
        createdAt: '2026-03-10T10:00:00.000Z',
      },
    ],
    averageRating: 4,
    pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    ...overrides,
  });

  it('mapea los campos de cada item correctamente', () => {
    const result = CrmMapper.toGuestRatings(buildDto());

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.id).toBe('rating-1');
    expect(item.unitId).toBe('unit-abc');
    expect(item.unitName).toBe('Suite deluxe');
    expect(item.rate).toBe(4);
    expect(item.message).toBe('Excelente estancia');
    expect(item.createdAt).toBe('2026-03-10T10:00:00.000Z');
  });

  it('mapea averageRating y pagination correctamente', () => {
    const result = CrmMapper.toGuestRatings(buildDto());

    expect(result.averageRating).toBe(4);
    expect(result.pagination).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('retorna lista vacía cuando items es []', () => {
    const result = CrmMapper.toGuestRatings(buildDto({ items: [], averageRating: 0 }));

    expect(result.items).toHaveLength(0);
    expect(result.averageRating).toBe(0);
  });

  it('mapea múltiples items', () => {
    const dto = buildDto({
      items: [
        { id: 'r1', unitId: 'u1', unitName: 'Habitación A', rate: 5, message: 'Perfecto', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'r2', unitId: 'u2', unitName: 'Habitación B', rate: 3, message: 'Regular', createdAt: '2026-02-01T00:00:00Z' },
      ],
      averageRating: 4,
    });

    const result = CrmMapper.toGuestRatings(dto);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('r1');
    expect(result.items[1].id).toBe('r2');
  });

  it('preserva valores de paginación multi-página', () => {
    const dto = buildDto({
      pagination: { total: 50, page: 2, limit: 20, totalPages: 3 },
    });

    const result = CrmMapper.toGuestRatings(dto);

    expect(result.pagination.total).toBe(50);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.totalPages).toBe(3);
  });
});

describe('CrmMapper.toGuestBookingOrigins', () => {
  const buildDto = (overrides?: Partial<CrmGuestBookingOriginsResponseDto>): CrmGuestBookingOriginsResponseDto => ({
    total: 5,
    sources: [
      { source: 'DIRECT', count: 3, percentage: 60 },
      { source: 'AIRBNB', count: 2, percentage: 40 },
    ],
    ...overrides,
  });

  it('mapea el campo total correctamente', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ total: 10 }));

    expect(result.total).toBe(10);
  });

  it('mapea count y percentage de cada origen', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto());

    expect(result.sources[0].count).toBe(3);
    expect(result.sources[0].percentage).toBe(60);
    expect(result.sources[1].count).toBe(2);
    expect(result.sources[1].percentage).toBe(40);
  });

  it('normaliza DIRECT correctamente', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ sources: [{ source: 'DIRECT', count: 1, percentage: 100 }] }));

    expect(result.sources[0].source).toBe('DIRECT');
  });

  it('normaliza AIRBNB correctamente', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ sources: [{ source: 'AIRBNB', count: 1, percentage: 100 }] }));

    expect(result.sources[0].source).toBe('AIRBNB');
  });

  it('normaliza BOOKING correctamente', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ sources: [{ source: 'BOOKING', count: 1, percentage: 100 }] }));

    expect(result.sources[0].source).toBe('BOOKING');
  });

  it('normaliza VRBO correctamente', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ sources: [{ source: 'VRBO', count: 1, percentage: 100 }] }));

    expect(result.sources[0].source).toBe('VRBO');
  });

  it('normaliza MANUAL correctamente', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ sources: [{ source: 'MANUAL', count: 1, percentage: 100 }] }));

    expect(result.sources[0].source).toBe('MANUAL');
  });

  it('normaliza source desconocido a MANUAL', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ sources: [{ source: 'EXPEDIA', count: 1, percentage: 100 }] }));

    expect(result.sources[0].source).toBe('MANUAL');
  });

  it('retorna total 0 y sources vacío cuando sources es []', () => {
    const result = CrmMapper.toGuestBookingOrigins(buildDto({ total: 0, sources: [] }));

    expect(result.total).toBe(0);
    expect(result.sources).toHaveLength(0);
  });

  it('mapea múltiples orígenes preservando el orden', () => {
    const dto = buildDto({
      total: 10,
      sources: [
        { source: 'DIRECT', count: 5, percentage: 50 },
        { source: 'AIRBNB', count: 3, percentage: 30 },
        { source: 'BOOKING', count: 2, percentage: 20 },
      ],
    });

    const result = CrmMapper.toGuestBookingOrigins(dto);

    expect(result.sources).toHaveLength(3);
    expect(result.sources[0].source).toBe('DIRECT');
    expect(result.sources[1].source).toBe('AIRBNB');
    expect(result.sources[2].source).toBe('BOOKING');
  });
});
