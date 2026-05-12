export type OrderStatus = 'pending' | 'printing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  created_at: string
  format: string
  locale: string
  with_frame: boolean
  with_digital: boolean
  with_rush: boolean
  with_varnish: boolean
  with_3d_paint: boolean
  frame_color: string | null
  image_url: string | null
  status: OrderStatus
  customer_name: string
  customer_phone: string
  customer_email: string | null
  shipping_line1: string
  shipping_line2: string | null
  shipping_city: string
  shipping_postal_code: string
  shipping_state: string | null
  shipping_country: string
  updated_at: string
  synced_at: string
}
