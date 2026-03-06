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

  SALES_TYPES: [
    { code: 'DINE_IN', name: 'Dine In' },
    { code: 'TAKE_AWAY', name: 'Take Away' },
  ],
  UOMS: [
    { code: 'PCS' },
    { code: 'BOX' },
    { code: 'PACK' },
    { code: 'KG' },
    { code: 'GR' },
    { code: 'L' },
    { code: 'ML' },
    { code: 'M' },
    { code: 'CM' },
    { code: 'BUAH' },
    { code: 'IKAT' },
    { code: 'SACHET' },
    { code: 'ROLL' },
    { code: 'LUSIN' },
    { code: 'KODI' },
    { code: 'DUS' },
    { code: 'BOTOL' },
    { code: 'GALON' },
    { code: 'KALENG' },
    { code: 'KARUNG' },
    { code: 'RIM' },
    { code: 'PASANG' },
    { code: 'LEMBAR' },
  ],
} as const
