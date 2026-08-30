import { InventoryCategory, InventoryItem } from '@/domain/tenant/inventory/inventory.model';

/** Transport envelopes returned by the inventory endpoints. */
export interface InventoryCategoryListResponse {
  message: string;
  data: {
    categories: InventoryCategory[];
  };
}

export interface InventoryItemListResponse {
  message: string;
  data: InventoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
