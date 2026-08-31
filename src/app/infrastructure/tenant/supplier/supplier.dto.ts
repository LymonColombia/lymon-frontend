/** Wire shape of a supplier: the API keys it by supplierId, the domain by id. */
export interface SupplierDto {
  supplierId: string;
  name: string;
  nit: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}
