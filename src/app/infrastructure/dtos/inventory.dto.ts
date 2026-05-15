export interface CreateInventoryItemDto {
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  initialStock: number;
}

export interface InventoryItemResponse {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}
