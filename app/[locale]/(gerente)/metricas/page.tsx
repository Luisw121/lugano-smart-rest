import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import MetricasView from '@/components/gerente/MetricasView'

export const metadata: Metadata = { title: 'Metriche' }

export default async function MetricasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)

  const semanaInicio = new Date()
  semanaInicio.setDate(semanaInicio.getDate() - 6)
  semanaInicio.setHours(0, 0, 0, 0)

  const [
    { data: pedidosHoy },
    { data: pedidosSemana },
    { data: itemsTop },
    { data: stockAlertas },
    { data: pedidosActivos },
    { data: mesasOcupadas },
    { data: itemsCocina },
  ] = await Promise.all([
    supabase
      .from('pedidos')
      .select('total, metodo_pago, created_at')
      .eq('estado', 'pagado')
      .gte('created_at', hoyInicio.toISOString()),
    supabase
      .from('pedidos')
      .select('total, metodo_pago, created_at')
      .eq('estado', 'pagado')
      .gte('created_at', semanaInicio.toISOString()),
    // Top platos: agregamos en cliente (Supabase no hace GROUP BY fácil via JS SDK)
    supabase
      .from('pedido_items')
      .select('producto_id, cantidad, producto:productos(id, traducciones:productos_traducciones(idioma_id, nombre))')
      .gte('created_at', semanaInicio.toISOString()),
    supabase
      .from('v_stock_estado')
      .select('id, nombre, estado_stock')
      .in('estado_stock', ['critico', 'agotado']),
    supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .not('estado', 'in', '("pagado","cancelado")'),
    supabase
      .from('mesas')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'ocupada'),
    supabase
      .from('pedido_items')
      .select('id', { count: 'exact', head: true })
      .in('estado', ['pendiente', 'en_preparacion']),
  ])

  return (
    <MetricasView
      pedidosHoy={pedidosHoy ?? []}
      pedidosSemana={pedidosSemana ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      itemsRaw={(itemsTop ?? []) as any}
      stockAlertas={stockAlertas ?? []}
      ordenesActivas={pedidosActivos?.length ?? 0}
      mesasOcupadas={mesasOcupadas?.length ?? 0}
      itemsCocina={itemsCocina?.length ?? 0}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
