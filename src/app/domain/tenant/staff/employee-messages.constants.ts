export const EMPLOYEE_MESSAGES = {
  validation: {
    fullName: { required: 'El nombre es obligatorio.' },
    document: { required: 'El documento es obligatorio.' },
    email: {
      required: 'El correo electrónico es obligatorio.',
      email: 'Ingresa una dirección de correo válida.',
      maxlength: 'El correo no puede superar los 254 caracteres.',
      minLocalPartLength: 'El correo debe tener al menos 8 caracteres antes del símbolo @.',
    },
    password: {
      required: 'La contraseña es obligatoria.',
      minlength: 'La contraseña debe tener al menos 8 caracteres.',
    },
    roleId: { required: 'El rol es obligatorio.' },
    scopeType: { required: 'El tipo de alcance es obligatorio.' },
  },
  success: {
    create: 'Empleado registrado correctamente.',
    update: 'Empleado actualizado correctamente.',
    delete: 'Empleado eliminado correctamente.',
  },
  error: {
    loadEmployees: 'No fue posible cargar los empleados registrados.',
    deleteEmployee: 'Ocurrió un error al intentar eliminar el empleado.',
    loadRoles: 'No se pudieron cargar los roles disponibles.',
    conflict: 'Ya existe un empleado con este correo electrónico.',
    unauthorized: 'No autorizado. Por favor inicia sesión de nuevo.',
    invalidData: 'Datos inválidos. Verifica los campos.',
    unexpected: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
  },
  state: {
    loading: 'Cargando empleados...',
    emptyTitle: 'No se encontraron resultados',
    emptySubtitle: 'Intenta con otros términos de búsqueda.',
  },
  confirmation: {
    deleteTitle: '¿Eliminar empleado?',
    deleteMessage: (name: string) => `¿Estás seguro de que deseas eliminar permanentemente a "${name}"?`,
    deleteWarning: 'Esta acción no se puede deshacer y el usuario perderá acceso al sistema.',
    deleteConfirm: 'Sí, eliminar',
    deleteCancel: 'No, cancelar',
    deleteLoading: 'Eliminando...',
  },
  copy: '¡Copiado al portapapeles!',
  roleLabel: {
    ADMIN: 'Administrador',
    STAFF: 'Staff',
  },
  backend: {
    'El usuario ya es miembro de este tenant.': 'User is already a member of this tenant.',
  },
} as const;

export type EmployeeRole = keyof typeof EMPLOYEE_MESSAGES.roleLabel;

export function getEmployeeRoleLabel(role: string | null | undefined): string {
  const key = role?.toUpperCase() as EmployeeRole;
  return EMPLOYEE_MESSAGES.roleLabel[key] ?? (role || '');
}

export function getBackendErrorMessage(message: string | undefined | null): string | null {
  if (!message) return null;
  const msgLower = message.toLowerCase();
  for (const [key, value] of Object.entries(EMPLOYEE_MESSAGES.backend)) {
    if (msgLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
}
