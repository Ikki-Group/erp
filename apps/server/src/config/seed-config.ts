export const SEED_CONFIG = {
  ROLE_SUPERADMIN_CODE: 'SUPERADMIN',

  USER_SUPERADMIN_EMAIL: 'admin@ikki.com',
  USER_SUPERADMIN_PASSWORD: 'admin12345',
  USER_SUPERADMIN_USERNAME: 'admin',

  LOCATIONS: [
    {
      code: 'S-IC',
      name: 'Ikki Coffee',
      type: 'store',
    },
    {
      code: 'S-IR',
      name: 'Ikki Resto',
      type: 'store',
    },
    {
      code: 'W-RUMAH',
      name: 'Gudang Rumah',
      type: 'warehouse',
    },
  ],
} as const
