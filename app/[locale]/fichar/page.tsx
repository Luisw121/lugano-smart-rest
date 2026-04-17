export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import FichajeKiosk from '@/components/FichajeKiosk'

export const metadata: Metadata = { title: 'Fichaje · Lugano Smart Rest' }

export default async function FicharPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return <FichajeKiosk dict={dict} locale={locale as Locale} />
}
