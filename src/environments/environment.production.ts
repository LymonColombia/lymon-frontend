export const environment = {
  production: true,
  apiUrl: 'https://lymon-backend-development.onrender.com',
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
  },
  experiences: {
    endpoint: '/experiences',
  },
  storage: {
    endpoint: '/storage/presigned-url',
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
};
