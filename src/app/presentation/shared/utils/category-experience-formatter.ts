const EXPERIENCE_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  TRANSPORTATION: 'Transporte',
};

export function getCategoryLabel(category: string): string {
  const normalized = category.trim().toUpperCase();
  return EXPERIENCE_CATEGORY_LABELS[normalized] ?? normalized.charAt(0) + normalized.slice(1).toLowerCase();
}