/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MokaSalesDetailRaw {
  id: number
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
  outlet_id: number
  outlet_name: string
  outlet_address: string
  outlet_phone: string
  outlet_logo: any
  business_id: number
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
}

export interface MokaSalesItemRaw {
  id: number
  uuid: string
  item_id: number
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
  modifiers: any[]
}
