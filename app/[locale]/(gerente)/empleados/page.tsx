import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import EmpleadosView from '@/components/gerente/EmpleadosView'

export const metadata: Metadata = { title: 'Empleados' }

export default async function EmpleadosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const { data: empleados } = await supabase
    .from('v_empleados_estado')
    .select('*')
    .order('nombre')

  return (
    <EmpleadosView
      empleadosIniciales={empleados ?? []}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
