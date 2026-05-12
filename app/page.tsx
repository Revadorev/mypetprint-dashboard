'use client'

import { useEffect, useState, useCallback } from 'react'
import { Order } from '../lib/types'
import ImageModal from '../components/ImageModal'

const STATUS_LABELS: Record<string, string> = {
  all: 'Toate',
  pending: 'Pending',
  printing: 'Printing',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  printing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  shipped: 'bg-green-500/20 text-green-300 border border-green-500/30',
  delivered: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HomePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders${filter !== 'all' ? `?status=${filter}` : ''}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setLastSync(new Date().toLocaleTimeString('ro-RO'))
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function updateStatus(id: string, status: 'printing' | 'shipped') {
    setUpdating(id)
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      } else {
        const err = await res.json()
        alert(`Eroare: ${err.error}`)
      }
    } catch {
      alert('Eroare de rețea.')
    } finally {
      setUpdating(null)
    }
  }

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white text-sm">MP</div>
          <div>
            <h1 className="font-semibold text-base">MyPetPrint Dashboard</h1>
            <p className="text-xs text-slate-500">Comenzi furnizor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && <span className="text-xs text-slate-500">Actualizat: {lastSync}</span>}
          <button
            onClick={fetchOrders}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', key: 'pending', color: 'text-yellow-400' },
            { label: 'Printing', key: 'printing', color: 'text-blue-400' },
            { label: 'Shipped', key: 'shipped', color: 'text-green-400' },
            { label: 'Total', key: 'all', color: 'text-slate-300' },
          ].map(s => (
            <div key={s.key} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {s.key === 'all' ? orders.length : (counts[s.key] || 0)}
              </p>
            </div>
          ))}
        </div>

        {/* Filtre */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                filter === key
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Se încarcă...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Nicio comandă.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Comandă</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Opțiuni</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Adresă</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Imagine</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className={`border-b border-slate-800 transition-colors hover:bg-slate-800/30 ${
                      order.with_rush ? 'border-l-2 border-l-red-500' : ''
                    } ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}
                  >
                    {/* ID + Data */}
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-orange-400 text-xs">{order.id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.created_at)}</div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{order.customer_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{order.customer_phone}</div>
                      {order.customer_email && (
                        <div className="text-xs text-slate-500 mt-0.5">{order.customer_email}</div>
                      )}
                    </td>

                    {/* Format */}
                    <td className="px-4 py-3">
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">{order.format} cm</span>
                    </td>

                    {/* Optiuni */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.with_rush && (
                          <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded text-xs font-semibold">🚀 RUSH</span>
                        )}
                        {order.with_frame && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-xs">
                            Ramă {order.frame_color ? `(${order.frame_color})` : ''}
                          </span>
                        )}
                        {order.with_varnish && (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-xs">Varnish</span>
                        )}
                        {order.with_3d_paint && (
                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded text-xs">3D Paint</span>
                        )}
                        {order.with_digital && (
                          <span className="bg-slate-600/50 text-slate-300 border border-slate-600 px-1.5 py-0.5 rounded text-xs">Digital</span>
                        )}
                        {!order.with_rush && !order.with_frame && !order.with_varnish && !order.with_3d_paint && !order.with_digital && (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* Adresa */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <div>{order.shipping_line1}</div>
                        {order.shipping_line2 && <div>{order.shipping_line2}</div>}
                        <div>{order.shipping_city}{order.shipping_postal_code ? `, ${order.shipping_postal_code}` : ''}</div>
                        <div className="text-slate-500">{order.shipping_country}</div>
                      </div>
                    </td>

                    {/* Imagine */}
                    <td className="px-4 py-3">
                      {order.image_url ? (
                        <button
                          onClick={() => setPreviewImage(order.image_url)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600 hover:border-orange-500 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.image_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Actiuni */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(order.id, 'printing')}
                            disabled={updating === order.id}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {updating === order.id ? '...' : '🖨 Printing'}
                          </button>
                        )}
                        {order.status === 'printing' && (
                          <button
                            onClick={() => updateStatus(order.id, 'shipped')}
                            disabled={updating === order.id}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {updating === order.id ? '...' : '📦 Shipped'}
                          </button>
                        )}
                        {(order.status === 'shipped' || order.status === 'delivered') && (
                          <span className="text-slate-600 text-xs">✓ Finalizat</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Image Modal */}
      {previewImage && (
        <ImageModal url={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  )
}
