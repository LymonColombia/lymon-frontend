const PRICE_LOCALE = 'es-CO';

export function formatPrice(price: number): string {
  return price.toLocaleString(PRICE_LOCALE, { maximumFractionDigits: 0 });
}
