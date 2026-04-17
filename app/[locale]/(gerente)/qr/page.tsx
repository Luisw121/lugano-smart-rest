import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, locales, type Locale } from '@/lib/i18n/config'
import QrManager from '@/components/gerente/QrManager'

export const metadata: Metadata = { title: 'QR Codes' }

export default async function QrPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const { data: mesas } = await supabase
    .from('mesas')
    .select('id, numero, zona')
    .eq('activo', true)
    .order('numero')

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">QR Codes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Genera i codici QR per ogni tavolo — i clienti accedono direttamente alla carta digitale
        </p>
      </div>
      <QrManager mesas={mesas ?? []} />
    </div>
  )
}
