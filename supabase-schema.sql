-- MyPetPrint Dashboard — Supabase Schema
-- Ruleaza in SQL Editor: https://supabase.com/dashboard/project/geyeboqemgeayzxcblua/sql/new

create table if not exists orders (
  id text primary key,
  created_at timestamptz,
  format text,
  locale text,
  with_frame boolean default false,
  with_digital boolean default false,
  with_rush boolean default false,
  with_varnish boolean default false,
  with_3d_paint boolean default false,
  frame_color text,
  image_url text,
  status text default 'pending',
  customer_name text,
  customer_phone text,
  customer_email text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_postal_code text,
  shipping_state text,
  shipping_country text,
  updated_at timestamptz default now(),
  synced_at timestamptz default now()
);

-- Index pentru filtrare rapida pe status
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);
