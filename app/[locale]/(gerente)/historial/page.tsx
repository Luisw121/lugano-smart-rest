import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import HistorialView from '@/components/gerente/HistorialView'

export const metadata: Metadata = { title: 'Historial' }

export default async function HistorialPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, items:pedido_items(id, cantidad, precio_unitario, producto_id)')
    .eq('estado', 'pagado')
    .order('created_at', { ascending: false })
    .limit(100)

  return <HistorialView pedidosIniciales={pedidos ?? []} dict={dict} locale={locale as Locale} />
}
