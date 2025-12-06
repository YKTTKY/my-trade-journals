export interface Trade {
  id?: number
  user_id: string
  asset_type?: string | null
  asset_symbol?: string | null
  entry_price?: number | null
  exit_price?: number | null
  position_size?: number | null
  point_value?: number | null
  stop_loss?: number | null
  take_profit?: number | null
  fees?: number | null
  trade_date?: string | null // ISO string in UTC
  pnl?: number | null
  pnl_percentage?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  // allow additional fields when necessary
  [key: string]: any
}

export interface Tag {
  id?: number
  user_id?: string
  name: string
  category?: string | null
  emoji?: string | null
  created_at?: string
}

export interface TradeTag {
  trade_id: number
  tag_id: number
}

export interface TradeTagWithTag {
  tag_id: number
  tag: Tag
}

export interface TradeWithTags extends Trade {
  tags?: TradeTagWithTag[]
}

export interface Template {
  id?: number
  user_id: string
  name?: string
  data?: any
  created_at?: string
  updated_at?: string
}

export interface FetchTradesFilters {
  startDate?: string
  endDate?: string
  assetType?: string
  tags?: number[]
}

export type ID = number | string