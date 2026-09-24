import { InventoryCategory, InventoryItem } from '@/domain/tenant/inventory/inventory.model';

/** Transport envelopes returned by the inventory endpoints. */
export interface InventoryCategoryListDto {
  message: string;
  data: {
    categories: InventoryCategory[];
  };
}

export interface InventoryItemListDto {
  message: string;
  data: InventoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
