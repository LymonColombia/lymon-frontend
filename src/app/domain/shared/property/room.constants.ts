export const ROOM_LABELS = {
  unlimitedRooms: 'Habitaciones ilimitadas',
  propertiesAndRooms: 'Propiedades y Habitaciones',
  unitScopeLabel: 'UNIT — Habitación específica',
} as const;

export const ROOM_MESSAGES = {
  loadError: 'No se pudieron cargar las habitaciones. Inténtalo de nuevo.',
  loadEditError: 'No se pudo cargar la habitación para editar.',
  deleteSuccess: 'Habitación eliminada correctamente.',
  deleteError: 'Error al eliminar la habitación. Inténtalo de nuevo.',
  createSuccess: 'Habitación creada correctamente.',
  updateSuccess: 'Habitación actualizada correctamente.',
  loadExperienceError: 'No se pudieron cargar las habitaciones.',
  createErrorFallback: 'Error al crear la habitación. Inténtalo de nuevo.',
  updateErrorFallback: 'Error al actualizar la habitación. Inténtalo de nuevo.',
  noRoomAvailable: 'Habitación no disponible',
  unnamedRoom: 'Habitación sin nombre',
  unknownRoom: 'Habitación desconocida',
  roomNotSpecified: 'Habitación no especificada',
} as const;
