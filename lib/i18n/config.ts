export const locales = ['it', 'en', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'it'

export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  it: '🇮🇹',
  en: '🇬🇧',
  es: '🇪🇸',
}

export async function getDictionary(locale: Locale) {
  const dict = await import(`./dictionaries/${locale}.json`)
  return dict.default
}
