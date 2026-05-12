'use client'

interface ImageModalProps {
  url: string
  onClose: () => void
}

export default function ImageModal({ url, onClose }: ImageModalProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const filename = url.split('/').pop()?.split('?')[0] || 'imagine-comanda.jpg'
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      // fallback: deschide in tab nou
      window.open(url, '_blank')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Buton închide */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors"
        >
          ×
        </button>
        {/* Buton download */}
        <button
          onClick={handleDownload}
          className="absolute top-3 right-14 z-10 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          title="Descarcă imaginea"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Preview comandă"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  )
}
