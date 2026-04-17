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
  const contieneActivos = alergenos.filter((a) => alergenosActivos.has(a.id))
  const desactivado = !producto.disponible

  return (
    <div
      className={[
        'flex gap-0 rounded-2xl overflow-hidden border transition-all',
        desactivado
          ? 'border-stone-100 bg-stone-50 opacity-60'
          : 'border-stone-100 bg-white hover:border-stone-200 hover:shadow-md',
      ].join(' ')}
    >
      {/* Imagen — izquierda */}
      <div className="w-28 h-28 flex-shrink-0 bg-stone-100 relative overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={trad?.nombre ?? ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-stone-100">
            🍽️
          </div>
        )}
        {desactivado && (
          <div className="absolute inset-0 bg-stone-100/80 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider rotate-[-15deg]">
              {dict.agotado}
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-bold leading-tight ${desactivado ? 'text-stone-400' : 'text-stone-900'}`}>
              {trad?.nombre ?? '—'}
            </h3>
            <span className={`text-sm font-black flex-shrink-0 tabular-nums ${desactivado ? 'text-stone-300' : 'text-stone-900'}`}>
              {dict.chf} {producto.precio.toFixed(2)}
            </span>
          </div>

          {trad?.descripcion && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {trad.descripcion}
            </p>
          )}
        </div>

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
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors',
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
            {contieneActivos.length > 0 && (
              <span className="text-[10px] text-red-500 font-medium self-center ml-0.5">
                ⚠ {dict.alergenos_contiene}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
