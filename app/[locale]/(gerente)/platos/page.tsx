import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import PlatosView from '@/components/gerente/PlatosView'

export const metadata: Metadata = { title: 'Menu' }

export default async function PlatosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const [{ data: productos }, { data: categorias }] = await Promise.all([
    supabase
      .from('productos')
      .select(`
        id, precio, disponible, imagen_url, activo, categoria_id,
        traducciones:productos_traducciones(idioma_id, nombre, descripcion)
      `)
      .eq('activo', true)
      .order('categoria_id')
      .order('precio'),
    supabase
      .from('categorias')
      .select('id, slug, orden, traducciones:categorias_traducciones(idioma_id, nombre)')
      .eq('activo', true)
      .order('orden'),
  ])

  return (
    <PlatosView
      productosIniciales={productos ?? []}
      categorias={categorias ?? []}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
