export const EXPERIENCE_MESSAGES = {
  error: {
    createConflict: 'Ya existe una experiencia con este nombre para esta propiedad.',
    startInFuture: 'La experiencia debe iniciar al menos 24 horas en el futuro.',
    endAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio.',
    minimumParticipantsExceedCapacity: 'Los participantes mínimos no pueden ser mayores que los participantes máximos.',
    saveFallback: 'Ocurrió un error al guardar la experiencia. Inténtalo de nuevo.',
    loadExperiences: 'No se pudieron cargar las experiencias.',
    loadProperties: 'No se pudieron cargar las propiedades.',
    loadUnits: 'No se pudieron cargar las habitaciones.',
    loadEditExperience: 'No se pudo cargar la experiencia para editar.',
    loadExperienceById: 'No se pudo cargar la experiencia.',
    missingExperienceId: 'No se encontró el identificador de la experiencia.',
    missingExperience: 'No se encontró la experiencia solicitada.',
    deleteExperience: 'No se pudo eliminar la experiencia.',
  },
  success: {
    saveExperience: 'Experiencia guardada correctamente.',
    deleteExperience: 'Experiencia eliminada correctamente.',
  },
} as const;

const EXPERIENCE_BACKEND_MESSAGES: Record<string, string> = {
  'an experience with this name already exists for this property':
    EXPERIENCE_MESSAGES.error.createConflict,
  'experience start must be at least 24 hours in the future':
    EXPERIENCE_MESSAGES.error.startInFuture,
  'availability endat must be after startat':
    EXPERIENCE_MESSAGES.error.endAfterStart,
  'experience minimum participants cannot exceed capacity':
    EXPERIENCE_MESSAGES.error.minimumParticipantsExceedCapacity,
};


export function getExperienceSaveErrorMessage(error: unknown): string {
  const message = ((error as any)?.error?.message ?? (error as any)?.message ?? '').toLowerCase();
  
  return EXPERIENCE_BACKEND_MESSAGES[message] ?? EXPERIENCE_MESSAGES.error.saveFallback;
}



