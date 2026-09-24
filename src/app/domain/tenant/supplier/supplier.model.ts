export interface Supplier {
  id: string;
  name: string;
  nit: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CreateSupplier {
  name: string;
  nit: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}

export interface UpdateSupplier extends CreateSupplier {
  supplierId: string;
}
