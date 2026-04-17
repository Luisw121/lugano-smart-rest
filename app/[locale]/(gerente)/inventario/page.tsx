import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import InventarioTable from '@/components/gerente/InventarioTable'
import type { IngredienteConEstado } from '@/types/database'
import { AlertTriangle, PackageX } from 'lucide-react'

export const metadata: Metadata = { title: 'Inventario' }

export default async function InventarioPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const supabase = await createClient()
  const { data: ingredientes } = await supabase
    .from('v_stock_estado')
    .select('*')
    .order('nombre', { ascending: true })

  const items = (ingredientes ?? []) as IngredienteConEstado[]
  const criticos = items.filter((i) => i.estado_stock === 'critico').length
  const agotados = items.filter((i) => i.estado_stock === 'agotado').length

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {dict.inventario.titolo}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{dict.inventario.sottotitolo}</p>
      </div>

      {/* Alert banners */}
      {(criticos > 0 || agotados > 0) && (
        <div className="mb-6 space-y-2">
          {agotados > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <PackageX className="w-4 h-4 text-red-500 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-red-700 font-medium">
                {agotados} {dict.inventario.alerts.esauriti}
              </p>
            </div>
          )}
          {criticos > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-amber-700 font-medium">
                {criticos} {dict.inventario.alerts.stock_basso}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <InventarioTable
        ingredientes={items}
        dict={dict}
        locale={locale as Locale}
      />
    </div>
  )
}
