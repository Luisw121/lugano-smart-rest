import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import CartaMenu from '@/components/cliente/CartaMenu'

export const metadata: Metadata = {
  title: 'Menu · Lugano Smart Rest',
  description: 'Scopri la nostra cucina italiana a Lugano',
}

export default async function CartaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const [{ data: categorias }, { data: productos }, { data: alergenos }] =
    await Promise.all([
      supabase
        .from('categorias')
        .select('id, slug, orden, traducciones:categorias_traducciones(idioma_id, nombre)')
        .eq('activo', true)
        .order('orden'),
      supabase
        .from('productos')
        .select(`
          id, precio, disponible, imagen_url,
          categoria_id,
          traducciones:productos_traducciones(idioma_id, nombre, descripcion),
          alergenos:productos_alergenos(
            alergeno:alergenos(id, slug, icono,
              traducciones:alergenos_traducciones(idioma_id, nombre)
            )
          )
        `)
        .eq('activo', true)
        .order('precio'),
      supabase
        .from('alergenos')
        .select('id, slug, icono, traducciones:alergenos_traducciones(idioma_id, nombre)'),
    ])

  return (
    <CartaMenu
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categorias={(categorias ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productos={(productos ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alergenos={(alergenos ?? []) as any}
      dict={dict}
      locale={locale as Locale}
    />
  )
}
