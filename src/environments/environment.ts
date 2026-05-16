export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  auth: {
    endpoint: '/auth',
  },
  user: {
    endpoint: '/user',
  },
  incidentReport: {
    endpoint: '/incident-reports',
  },
  tenant: {
    endpoint: '/tenant',
  },
  properties: {
    endpoint: '/properties',
  },
  reservations: {
    endpoint: '/reservations',
  },
  units: {
    endpoint: '/units',
    unitDetailEndpoint: '/units/unit',
  },
  guestAuth: {
    endpoint: '/guest/auth',
  },
  audit: {
    endpoint: '/audit',
  },
  crm: {
    endpoint: '/crm',
    guestsEndpoint: '/guests',
  },
  shifts: {
    endpoint: '/shifts',
  },
  suppliers: {
    endpoint: '/suppliers',
  },
  storage: {
    endpoint: '/storage/presigned-url',
  },
  guestExperiences: {
    endpoint: '/guest/experiences',
  },
};
