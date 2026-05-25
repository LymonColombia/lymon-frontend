import { CrmMapper } from './crm.mapper';
import { CrmGuestRatingsResponseDto } from '@/infrastructure/dtos/crm.dto';

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
