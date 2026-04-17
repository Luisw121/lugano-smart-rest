import type { Locale } from '@/types/database'

interface Alergeno {
  id: string
  slug: string
  icono: string
  traducciones: { idioma_id: string; nombre: string }[]
}

interface Producto {
  id: string
  precio: number
  disponible: boolean
  imagen_url: string | null
  categoria_id: string | null
  traducciones: { idioma_id: string; nombre: string; descripcion: string | null }[]
  alergenos: { alergeno: Alergeno }[]
}

interface Props {
  producto: Producto
  locale: Locale
  dict: Record<string, string>
  alergenosActivos: Set<string>
}

export default function CartaProducto({ producto, locale, dict, alergenosActivos }: Props) {
  const trad =
    producto.traducciones.find((t) => t.idioma_id === locale) ??
    producto.traducciones[0]

  const alergenos = producto.alergenos.map((a) => a.alergeno)

  // Resaltar alérgenos que el cliente filtra
  const contieneActivos = alergenos.filter((a) => alergenosActivos.has(a.id))

  const desactivado = !producto.disponible

  return (
    <div
      className={[
        'flex gap-4 p-4 rounded-2xl border transition-all',
        desactivado
          ? 'border-stone-100 bg-stone-50 opacity-60'
          : 'border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Imagen */}
      {producto.imagen_url ? (
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
          <img
            src={producto.imagen_url}
            alt={trad?.nombre ?? ''}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-stone-100 flex items-center justify-center text-2xl">
          🍽️
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={[
              'text-sm font-semibold leading-tight',
              desactivado ? 'text-stone-400' : 'text-stone-900',
            ].join(' ')}
          >
            {trad?.nombre ?? '—'}
          </h3>
          <span
            className={[
              'text-sm font-bold flex-shrink-0 tabular-nums',
              desactivado ? 'text-stone-400' : 'text-stone-900',
            ].join(' ')}
          >
            {dict.chf} {producto.precio.toFixed(2)}
          </span>
        </div>

        {trad?.descripcion && (
          <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
            {trad.descripcion}
          </p>
        )}

        {/* Alérgenos */}
        {alergenos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {alergenos.map((al) => {
              const esActivo = alergenosActivos.has(al.id)
              const nombre =
                al.traducciones.find((t) => t.idioma_id === locale)?.nombre ??
                al.traducciones[0]?.nombre ??
                al.slug
              return (
                <span
                  key={al.id}
                  title={`${dict.alergenos_contiene}: ${nombre}`}
                  className={[
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs transition-colors',
                    esActivo
                      ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                      : 'bg-stone-100 text-stone-500',
                  ].join(' ')}
                >
                  <span>{al.icono}</span>
                  <span className="hidden sm:inline">{nombre}</span>
                </span>
              )
            })}
          </div>
        )}

        {/* Badge agotado */}
        {desactivado && (
          <span className="inline-block mt-2 text-xs font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            {dict.agotado}
          </span>
        )}
      </div>
    </div>
  )
}
