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

  // Query empleados + last fichaje per employee
  const { data: empleados } = await supabase
    .from('empleados')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  // Get today's fichajes to compute who is on shift
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const { data: fichajes } = await supabase
    .from('fichajes')
    .select('empleado_id, tipo, created_at')
    .gte('created_at', hoy.toISOString())
    .order('created_at', { ascending: false })

  // Merge: find last fichaje per employee
  const lastFichaje = new Map<string, { tipo: string; created_at: string }>()
  for (const f of fichajes ?? []) {
    if (!lastFichaje.has(f.empleado_id)) {
      lastFichaje.set(f.empleado_id, { tipo: f.tipo, created_at: f.created_at })
    }
  }

  const empleadosConEstado = (empleados ?? []).map((e) => {
    const lf = lastFichaje.get(e.id)
    return {
      ...e,
      ultimo_fichaje:    lf?.tipo ?? null,
      ultimo_fichaje_at: lf?.created_at ?? null,
      en_turno:          lf?.tipo === 'entrada',
    }
  })

  return (
    <EmpleadosView
      empleadosIniciales={empleadosConEstado}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
