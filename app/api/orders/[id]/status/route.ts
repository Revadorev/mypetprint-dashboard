import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'

const SUPPLIER_API_URL = process.env.SUPPLIER_API_URL || 'https://mypetprint.ro'
const SUPPLIER_API_TOKEN = process.env.SUPPLIER_API_TOKEN!

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json()
  const { status } = body

  if (!['printing', 'shipped'].includes(status)) {
    return NextResponse.json({ error: 'Status invalid. Acceptat: printing, shipped' }, { status: 400 })
  }

  // 1. Update in Supplier API
  const supplierRes = await fetch(`${SUPPLIER_API_URL}/api/supplier/orders/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SUPPLIER_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: [id], status }),
  })

  if (!supplierRes.ok) {
    const err = await supplierRes.text()
    return NextResponse.json({ error: `Supplier API error: ${err}` }, { status: 502 })
  }

  // 2. Update in Supabase
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id, status })
}
