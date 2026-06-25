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
    unitDetailEndpoint: '/units/unit',
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
  plans: {
    endpoint: '',
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
  guestExperiences: {
    endpoint: '/guest/experiences',
  },
  guests: {
    endpoint: '/guests',
  },
  guestReservations: {
    endpoint: '/guest-reservations',
  }
};