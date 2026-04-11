export interface SupplierDto {
  id: string;
  name: string;
  nit: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CreateSupplierDto {
  name: string;
  nit: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}

export interface UpdateSupplierDto extends CreateSupplierDto {
  id: string;
}
