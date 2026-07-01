import { CrmMapper } from './crm.mapper';
import { CrmGuestRatingsResponseDto, CrmGuestStatsDto } from '@/infrastructure/dtos/crm.dto';

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

describe('CrmMapper.toGuestStats', () => {
  const buildDto = (overrides?: Partial<CrmGuestStatsDto>): CrmGuestStatsDto => ({
    monthlySpending: {
      items: [
        { year: 2026, month: 3, label: 'Mar 2026', totalSpend: 275000 },
      ],
    },
    bookingOrigins: {
      total: 5,
      sources: [
        { source: 'DIRECT', count: 3, percentage: 60 },
        { source: 'AIRBNB', count: 2, percentage: 40 },
      ],
    },
    ...overrides,
  });

  it('mapea los cuatro campos de cada item de monthlySpending', () => {
    const result = CrmMapper.toGuestStats(buildDto());

    expect(result.monthlySpending).toHaveLength(1);
    const item = result.monthlySpending[0];
    expect(item.year).toBe(2026);
    expect(item.month).toBe(3);
    expect(item.label).toBe('Mar 2026');
    expect(item.totalSpend).toBe(275000);
  });

  it('retorna monthlySpending vacío cuando items es []', () => {
    const result = CrmMapper.toGuestStats(buildDto({ monthlySpending: { items: [] } }));

    expect(result.monthlySpending).toHaveLength(0);
  });

  it('mapea múltiples items de monthlySpending preservando el orden', () => {
    const dto = buildDto({
      monthlySpending: {
        items: [
          { year: 2026, month: 1, label: 'Ene 2026', totalSpend: 100000 },
          { year: 2026, month: 2, label: 'Feb 2026', totalSpend: 200000 },
          { year: 2026, month: 3, label: 'Mar 2026', totalSpend: 300000 },
        ],
      },
    });

    const result = CrmMapper.toGuestStats(dto);

    expect(result.monthlySpending).toHaveLength(3);
    expect(result.monthlySpending[0]).toEqual({ year: 2026, month: 1, label: 'Ene 2026', totalSpend: 100000 });
    expect(result.monthlySpending[1]).toEqual({ year: 2026, month: 2, label: 'Feb 2026', totalSpend: 200000 });
    expect(result.monthlySpending[2]).toEqual({ year: 2026, month: 3, label: 'Mar 2026', totalSpend: 300000 });
  });

  it('preserva totalSpend igual a 0 sin descartarlo', () => {
    const result = CrmMapper.toGuestStats(
      buildDto({ monthlySpending: { items: [{ year: 2026, month: 4, label: 'Abr 2026', totalSpend: 0 }] } }),
    );

    expect(result.monthlySpending[0].totalSpend).toBe(0);
  });

  it('preserva el número de mes en sus límites (1 y 12)', () => {
    const result = CrmMapper.toGuestStats(
      buildDto({
        monthlySpending: {
          items: [
            { year: 2026, month: 1, label: 'Ene 2026', totalSpend: 100 },
            { year: 2026, month: 12, label: 'Dic 2026', totalSpend: 200 },
          ],
        },
      }),
    );

    expect(result.monthlySpending[0].month).toBe(1);
    expect(result.monthlySpending[1].month).toBe(12);
  });

  it('mapea el campo total de bookingOrigins correctamente', () => {
    const result = CrmMapper.toGuestStats(buildDto({ bookingOrigins: { total: 10, sources: [] } }));

    expect(result.bookingOrigins.total).toBe(10);
  });

  it('mapea count y percentage de cada origen de bookingOrigins', () => {
    const result = CrmMapper.toGuestStats(buildDto());

    expect(result.bookingOrigins.sources[0].count).toBe(3);
    expect(result.bookingOrigins.sources[0].percentage).toBe(60);
    expect(result.bookingOrigins.sources[1].count).toBe(2);
    expect(result.bookingOrigins.sources[1].percentage).toBe(40);
  });

  it.each([
    ['DIRECT', 'DIRECT'],
    ['AIRBNB', 'AIRBNB'],
    ['BOOKING', 'BOOKING'],
    ['VRBO', 'VRBO'],
    ['MANUAL', 'MANUAL'],
    ['EXPEDIA', 'MANUAL'],
  ])('normaliza source "%s" a "%s"', (raw, expected) => {
    const result = CrmMapper.toGuestStats(
      buildDto({ bookingOrigins: { total: 1, sources: [{ source: raw, count: 1, percentage: 100 }] } }),
    );

    expect(result.bookingOrigins.sources[0].source).toBe(expected);
  });

  it('retorna total 0 y sources vacío cuando sources es []', () => {
    const result = CrmMapper.toGuestStats(buildDto({ bookingOrigins: { total: 0, sources: [] } }));

    expect(result.bookingOrigins.total).toBe(0);
    expect(result.bookingOrigins.sources).toHaveLength(0);
  });

  it('mapea múltiples orígenes de bookingOrigins preservando el orden', () => {
    const dto = buildDto({
      bookingOrigins: {
        total: 10,
        sources: [
          { source: 'DIRECT', count: 5, percentage: 50 },
          { source: 'AIRBNB', count: 3, percentage: 30 },
          { source: 'BOOKING', count: 2, percentage: 20 },
        ],
      },
    });

    const result = CrmMapper.toGuestStats(dto);

    expect(result.bookingOrigins.sources).toHaveLength(3);
    expect(result.bookingOrigins.sources[0].source).toBe('DIRECT');
    expect(result.bookingOrigins.sources[1].source).toBe('AIRBNB');
    expect(result.bookingOrigins.sources[2].source).toBe('BOOKING');
  });

  it('mapea monthlySpending y bookingOrigins juntos en una sola llamada', () => {
    const result = CrmMapper.toGuestStats(buildDto());

    expect(result).toEqual({
      monthlySpending: [{ year: 2026, month: 3, label: 'Mar 2026', totalSpend: 275000 }],
      bookingOrigins: {
        total: 5,
        sources: [
          { source: 'DIRECT', count: 3, percentage: 60 },
          { source: 'AIRBNB', count: 2, percentage: 40 },
        ],
      },
    });
  });
});
