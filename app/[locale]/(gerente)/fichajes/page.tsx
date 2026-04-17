import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import FichajesView from '@/components/gerente/FichajesView'

export const metadata: Metadata = { title: 'Fichajes' }

export default async function FichajesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const { data: fichajes } = await supabase
    .from('fichajes')
    .select('*, empleado:empleados(nombre, rol)')
    .gte('created_at', hoy.toISOString())
    .order('created_at', { ascending: false })

  return (
    <FichajesView
      fichajesIniciales={fichajes ?? []}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
