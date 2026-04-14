export interface MokaSalesDetailRaw {
  id?: string
  uuid: string
  payment_no: string
  parent_order_uuid: string
  parent_order_created_at: string
  created_at: string
  total_collected_amount: number
  subtotal: number
  payment_type: string
  payment_type_label: string
  payment_note: string
  tendered: number
  change: number
  include_gratuity_tax: boolean
  enable_tax: boolean
  enable_gratuity: boolean
  card_type: any
  card_no: any
  collector_name: string
  creator_name: string
  server_name: string
  business_name: string
  business_logo: any
  business_address: string
  outlet_id?: string
  outlet_name: string
  outlet_address: string
  outlet_phone: string
  outlet_logo: any
  business_id?: string
  customer_email: string
  customer_phone: string
  customer_name: string
  table_name: string
  total_redeem_amount: number
  total_rounding_amount: number
  refundable: boolean
  total_refund: number
  receipt_count: number
  pax: number
  bill_name: string
  order_id: string
  guid: string
  bill_created_at: string
  items: MokaSalesItemRaw[]
  order_items?: Record<string, MokaSalesItemRaw[]>
}

export interface MokaSalesItemRaw {
  id?: string
  uuid: string
  item_id?: string
  item_name: string
  item_variant_name: string
  item_variant_sku: string
  item_image: string
  price: number
  quantity: number
  note: string
  sales_type_name: string
  redeem_amount: number
  is_program_item: boolean
  item_type: string
  modifiers: MokaModifierRaw[]
}

export interface MokaModifierRaw {
  id?: string
  uuid: string
  created_at: string
  updated_at: any
  gross_sales: number
  net_sales: number
  modifier_id?: string
  discount_amount: number
  modifier_option_name: string
  price: number
  modifier_name: string
  modifier_option_id?: string
  cogs: number
  redeem_amount: number
  discounts: any[]
}

export interface MokaCategoryRaw {
  id?: string
  name: string
  created_at: string
  updated_at: string
}

export interface MokaProductRaw {
  id?: string
  name: string
  category_name: string | null
  item_variants: Array<{ id?: string; name: string; price: number; sku: string | null }>
}

export interface MokaLoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  outlets: Array<{ id?: string; name: string }>
}
