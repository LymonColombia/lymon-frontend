export interface CreateInventoryItemDto {
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  minStock: number;
  initialStock: number;
}

export interface InventoryItemResponse {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  minStock: number;
  currentStock: number;
  lowStock: boolean;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryCategoryDto {
  name: string;
  description: string;
}

export interface InventoryCategoryResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategoryListResponse {
  message: string;
  data: {
    categories: InventoryCategoryResponse[];
  };
}

export interface InventoryItemListResponse {
  message: string;
  data: InventoryItemResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
