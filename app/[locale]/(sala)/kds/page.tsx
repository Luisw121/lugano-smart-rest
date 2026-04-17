import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import KdsBoard from '@/components/sala/KdsBoard'
import type { Pedido, Producto, ProductoTrad } from '@/types/database'

export const metadata: Metadata = { title: 'Cucina · KDS' }

export default async function KdsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const [{ data: pedidos }, { data: productos }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesas(numero, zona),
        items:pedido_items(*)
      `)
      .not('estado', 'in', '("pagado","cancelado")')
      .order('created_at', { ascending: true }),
    supabase
      .from('productos')
      .select('id, traducciones:productos_traducciones(idioma_id, nombre)')
      .eq('activo', true),
  ])

  return (
    <KdsBoard
      pedidosIniciales={(pedidos ?? []) as Pedido[]}
      productos={(productos ?? []) as (Producto & { traducciones: ProductoTrad[] })[]}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
