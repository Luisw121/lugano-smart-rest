'use client'

import { useEffect, useRef, useState } from 'react'
import { QrCode, Download, ExternalLink, Copy, Check } from 'lucide-react'

interface Mesa {
  id: string
  numero: number
  zona: string
}

// Genera SVG de QR via API pública (no deps extra)
function qrUrl(text: string, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=svg&qzone=2`
}

function cartaUrl(numero: number) {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/it/carta#mesa-${numero}`
}

export default function QrManager({ mesas }: { mesas: Mesa[] }) {
  const [base, setBase] = useState('')
  const [copiado, setCopiado] = useState<number | null>(null)

  useEffect(() => {
    setBase(window.location.origin)
  }, [])

  async function copiarUrl(numero: number) {
    const url = `${base}/it/carta`
    await navigator.clipboard.writeText(url)
    setCopiado(numero)
    setTimeout(() => setCopiado(null), 2000)
  }

  async function descargar(numero: number) {
    const url = `${base}/it/carta`
    const svgUrl = qrUrl(url, 400)
    const res = await fetch(svgUrl)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `qr-tavolo-${numero}.svg`
    a.click()
  }

  const zonas = Array.from(new Set(mesas.map((m) => m.zona))).sort()

  return (
    <div className="space-y-8">
      {/* URL base */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <p className="text-xs font-medium text-blue-700 mb-1">URL della carta digitale</p>
        <p className="text-sm text-blue-900 font-mono break-all">
          {base}/[it|en|es]/carta
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Il QR porta sempre alla versione italiana — il cliente può cambiare lingua
        </p>
      </div>

      {/* Grid por zona */}
      {zonas.map((zona) => (
        <div key={zona}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 capitalize">
            {zona}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mesas
              .filter((m) => m.zona === zona)
              .map((mesa) => {
                const url = base ? `${base}/it/carta` : ''
                return (
                  <div
                    key={mesa.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm"
                  >
                    {/* QR */}
                    <div className="w-28 h-28 bg-white rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                      {url ? (
                        <img
                          src={qrUrl(url, 200)}
                          alt={`QR Tavolo ${mesa.numero}`}
                          className="w-full h-full"
                        />
                      ) : (
                        <QrCode className="w-10 h-10 text-gray-200" strokeWidth={1} />
                      )}
                    </div>

                    {/* Número */}
                    <p className="text-lg font-black text-gray-900">Tavolo {mesa.numero}</p>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 w-full">
                      <button
                        onClick={() => copiarUrl(mesa.numero)}
                        title="Copia URL"
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {copiado === mesa.numero
                          ? <><Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} /> OK</>
                          : <><Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> URL</>
                        }
                      </button>
                      <button
                        onClick={() => descargar(mesa.numero)}
                        title="Scarica SVG"
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> SVG
                      </button>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Apri carta"
                          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      {mesas.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <QrCode className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1} />
          <p className="text-sm">Nessun tavolo ancora. Creane dal Mapa de Mesas.</p>
        </div>
      )}
    </div>
  )
}
