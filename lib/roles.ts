export type Rol = 'manager' | 'sala' | 'cucina'

export const ROLES = {
  manager: {
    label:    { it: 'Manager',  en: 'Manager', es: 'Gerente' },
    emoji:    '🧑‍💼',
    desc:     { it: 'Inventario, cassa e metriche', en: 'Inventory, cash & metrics', es: 'Inventario, caja y métricas' },
    color:    'from-gray-900 to-gray-700',
    ring:     'ring-gray-900',
    homeUrl:  (locale: string) => `/${locale}/inventario`,
    cookieName: 'lsr_manager',
    pin: () => process.env.NEXT_PUBLIC_PIN_MANAGER ?? '1111',
  },
  sala: {
    label:    { it: 'Sala',     en: 'Floor',   es: 'Sala' },
    emoji:    '🍽️',
    desc:     { it: 'Mappa tavoli e comande', en: 'Table map & orders', es: 'Mapa de mesas y comandas' },
    color:    'from-amber-600 to-amber-400',
    ring:     'ring-amber-500',
    homeUrl:  (locale: string) => `/${locale}/mesas`,
    cookieName: 'lsr_sala',
    pin: () => process.env.NEXT_PUBLIC_PIN_SALA ?? '2222',
  },
  cucina: {
    label:    { it: 'Cucina',   en: 'Kitchen', es: 'Cocina' },
    emoji:    '👨‍🍳',
    desc:     { it: 'Display comande in tempo reale', en: 'Real-time orders display', es: 'Display de comandas' },
    color:    'from-orange-700 to-red-500',
    ring:     'ring-orange-500',
    homeUrl:  (locale: string) => `/${locale}/kds`,
    cookieName: 'lsr_cucina',
    pin: () => process.env.NEXT_PUBLIC_PIN_CUCINA ?? '3333',
  },
} as const

export const COOKIE_MAX_AGE = 60 * 60 * 12 // 12 horas
