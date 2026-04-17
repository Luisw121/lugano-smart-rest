import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import RestauranteView from '@/components/gerente/RestauranteView'

export const metadata: Metadata = { title: 'Gestione Tavoli' }
export const dynamic = 'force-dynamic'

export default async function RestaurantePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const supabase = await createClient()

  const { data: mesas } = await supabase
    .from('mesas')
    .select('*')
    .eq('activo', true)
    .order('numero')

  return <RestauranteView mesasIniciales={mesas ?? []} />
}
