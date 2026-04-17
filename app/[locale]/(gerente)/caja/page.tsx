import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import CajaView from '@/components/gerente/CajaView'

export const metadata: Metadata = { title: 'Cassa' }

export default async function CajaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  // Movimientos de hoy (zona horaria Lugano = Europe/Rome)
  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)

  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select('*, pedido:pedidos(id)')
    .gte('created_at', hoyInicio.toISOString())
    .order('created_at', { ascending: false })

  // Pedidos pagados hoy para el resumen
  const { data: pedidosHoy } = await supabase
    .from('pedidos')
    .select('total, metodo_pago')
    .eq('estado', 'pagado')
    .gte('created_at', hoyInicio.toISOString())

  return (
    <CajaView
      movimientosIniciales={movimientos ?? []}
      pedidosHoy={pedidosHoy ?? []}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
