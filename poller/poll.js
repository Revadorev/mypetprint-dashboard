require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUPPLIER_API_URL = process.env.SUPPLIER_API_URL || 'https://mypetprint.ro'
const SUPPLIER_API_TOKEN = process.env.SUPPLIER_API_TOKEN

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

async function fetchOrders() {
  const res = await fetch(`${SUPPLIER_API_URL}/api/supplier/orders`, {
    headers: {
      'Authorization': `Bearer ${SUPPLIER_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.orders || []
}

async function upsertOrders(orders) {
  if (orders.length === 0) {
    log('Nicio comanda noua.')
    return
  }

  // Citim statusurile existente ca sa nu suprascriem printing/shipped cu pending
  const ids = orders.map(o => o.id)
  const { data: existing } = await supabase
    .from('orders')
    .select('id, status')
    .in('id', ids)

  const existingMap = {}
  ;(existing || []).forEach(r => { existingMap[r.id] = r.status })

  const rows = orders.map(o => {
    const currentStatus = existingMap[o.id]
    // Nu suprascriem status daca e deja printing sau shipped
    const status = (currentStatus === 'printing' || currentStatus === 'shipped')
      ? currentStatus
      : o.status

    return {
      id: o.id,
      created_at: o.created_at,
      format: o.format,
      locale: o.locale,
      with_frame: o.with_frame,
      with_digital: o.with_digital,
      with_rush: o.with_rush,
      with_varnish: o.with_varnish,
      with_3d_paint: o.with_3d_paint,
      frame_color: o.frame_color,
      image_url: o.image_url,
      status,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_email: o.customer_email || null,
      shipping_line1: o.shipping_line1,
      shipping_line2: o.shipping_line2 || null,
      shipping_city: o.shipping_city,
      shipping_postal_code: o.shipping_postal_code,
      shipping_state: o.shipping_state || null,
      shipping_country: o.shipping_country,
      synced_at: new Date().toISOString(),
    }
  })

  const { error } = await supabase
    .from('orders')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw new Error(`Supabase upsert error: ${error.message}`)
  log(`✅ Upsert ${rows.length} comenzi.`)
}

async function poll() {
  log('🔄 Polling comenzi...')
  try {
    const orders = await fetchOrders()
    log(`📦 ${orders.length} comenzi pending din API.`)
    await upsertOrders(orders)
  } catch (err) {
    log(`❌ Eroare: ${err.message}`)
  }
}

// Ruleaza imediat la start
poll()

// Apoi la fiecare 10 minute
cron.schedule('*/10 * * * *', () => {
  poll()
})

log('🚀 Poller pornit. Interval: 10 minute.')
