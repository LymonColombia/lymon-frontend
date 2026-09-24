export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  minStock: number;
  currentStock: number;
  lowStock: boolean;
  supplierId: string | null;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItem {
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  minStock: number;
  initialStock: number;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryCategory {
  name: string;
  description: string;
}
