import { HttpErrorResponse } from '@angular/common/http';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'La solicitud contiene datos inválidos. Revisá los campos e intentá de nuevo.',
  401: 'Tu sesión expiró. Iniciá sesión nuevamente.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'El recurso no fue encontrado.',
  409: 'Ya existe un recurso con estos datos.',
  422: 'Los datos enviados no son válidos.',
  500: 'Ocurrió un error en el servidor. Intentá más tarde.',
  0: 'Sin conexión. Verificá tu conexión a internet.',
};

const FALLBACK_MESSAGE = 'Ocurrió un error inesperado. Intentá de nuevo.';

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractBackendMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return '';

  const body = error.error;
  if (!body || typeof body !== 'object') return '';

  const message = (body as Record<string, unknown>)['message'];
  if (typeof message === 'string' && message.length > 0) return message;
  if (Array.isArray(message) && message.length > 0) return message.join(' ');

  return '';
}

function translateCustomMessage(message: string, translations: Record<string, string>): string | null {
  const normalized = normalizeMessage(message);

  for (const [key, value] of Object.entries(translations)) {
    const normalizedKey = normalizeMessage(key);
    if (normalized === normalizedKey || normalized.includes(normalizedKey)) {
      return value;
    }
  }

  return null;
}

export function translateHttpError(
  error: HttpErrorResponse | unknown,
  customTranslations: Record<string, string> = {}
): string {
  const backendMessage = extractBackendMessage(error);

  if (backendMessage) {
    const customTranslation = translateCustomMessage(backendMessage, customTranslations);
    if (customTranslation) return customTranslation;

    const hasSpanishChars = /[áéíóúñÁÉÍÓÚÑ¿¡]/i.test(backendMessage);
    if (hasSpanishChars) return backendMessage;
  }

  if (error instanceof HttpErrorResponse) {
    return STATUS_MESSAGES[error.status] ?? FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}
