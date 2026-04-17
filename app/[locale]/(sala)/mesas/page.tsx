import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import MapaMesas from '@/components/sala/MapaMesas'
import type { Mesa, Pedido, Producto, ProductoTrad } from '@/types/database'

export const metadata: Metadata = { title: 'Mesas' }

export default async function MesasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const [{ data: mesas }, { data: pedidos }, { data: productos }] = await Promise.all([
    supabase.from('mesas').select('*').eq('activo', true).order('numero'),
    supabase
      .from('pedidos')
      .select('*, items:pedido_items(*)')
      .not('estado', 'in', '("pagado","cancelado")'),
    supabase
      .from('productos')
      .select('*, traducciones:productos_traducciones(*)')
      .eq('activo', true)
      .eq('disponible', true)
      .order('precio'),
  ])

  return (
    <MapaMesas
      mesasIniciales={(mesas ?? []) as Mesa[]}
      pedidosIniciales={(pedidos ?? []) as Pedido[]}
      productos={(productos ?? []) as (Producto & { traducciones: ProductoTrad[] })[]}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
