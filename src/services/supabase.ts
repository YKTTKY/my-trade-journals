import { FetchTradesFilters, TradeWithTags, Trade, Tag, Template } from '@/types/supabase'
import { createClient, SupabaseClient, Session, User, PostgrestError } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase : SupabaseClient= createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations

export const signUp = async (email: string, password:string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password:string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Trade operations
export const fetchTrades = async (
  userId: string,
  filters: FetchTradesFilters = {}
): Promise<{ data: TradeWithTags[] | null; error: PostgrestError | null }> => {
  let query = supabase
    .from('trades')
    .select(`*, tags:trade_tags(tag_id, tag:tags(name, category, emoji))`)
    .eq('user_id', userId)
    .order('trade_date', { ascending: false })

  // Apply filters
  if (filters.startDate) {
    query = query.gte('trade_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('trade_date', filters.endDate)
  }
  if (filters.assetType) {
    query = query.eq('asset_type', filters.assetType)
  }

  if (filters.tags && filters.tags.length > 0) {
    // Resolve trade IDs that match the tag filters and use them in the query
    const tradeIds = await selectTradeIdsByTags(filters.tags)
    if (tradeIds.length === 0) {
      return { data: [], error: null }
    }
    query = query.in('id', tradeIds)
  }

  const { data, error } = await query
  return { data: data as TradeWithTags[] | null, error }
}

export const addTrade = async (trade: Partial<Trade>): Promise<{ data: Trade | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('trades')
    .insert(trade)
    .select()
    .single()

  return { data: data as Trade | null, error }
}

export const updateTrade = async (id: number, updates: Partial<Trade>): Promise<{ data: any | null; error: PostgrestError | null }> => {
  // Create a completely isolated update query to avoid any relationship query conflicts
  const updateResult = await supabase
    .from('trades')
    .update(updates)
    .eq('id', id)

  if (updateResult.error) {
    console.error('Update error:', updateResult.error)
    return { data: null, error: updateResult.error }
  }

  // Successfully updated - return success without fetching
  return { data: updateResult.data, error: null }
}

export const deleteTrade = async (id: number): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)

  return { error }
}

// Tag operations
export const fetchTags = async (userId: string): Promise<{ data: Tag[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  return { data: data as Tag[] | null, error }
}

export const addTag = async (tag: Partial<Tag>): Promise<{ data: Tag | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single()

  return { data: data as Tag | null, error }
}

export const assignTagsToTrade = async (tradeId: number, tagIds: number[]): Promise<{ error: PostgrestError | null }> => {
  const assignments = tagIds.map(tagId => ({
    trade_id: tradeId,
    tag_id: tagId
  }))

  const { error } = await supabase
    .from('trade_tags')
    .insert(assignments)

  return { error }
}

export const removeTagFromTrade = async (tradeId: number, tagId: number): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('trade_tags')
    .delete()
    .eq('trade_id', tradeId)
    .eq('tag_id', tagId)

  return { error }
}

// Template operations
export const fetchTemplates = async (userId: string): Promise<{ data: Template[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data: data as Template[] | null, error }
}

export const addTemplate = async (template: Partial<Template>): Promise<{ data: Template | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('templates')
    .insert(template)
    .select()
    .single()

  return { data: data as Template | null, error }
}

export const updateTemplate = async (id: number, updates: Partial<Template>): Promise<{ data: Template | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Template | null, error }
}

export const deleteTemplate = async (id: number): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)

  return { error }
}

// Helper to get trade IDs that match tag filters
const selectTradeIdsByTags = async (tagIds: number[]): Promise<number[]> => {
  if (!tagIds || tagIds.length === 0) return []

  const { data, error } = await supabase
    .from('trade_tags')
    .select('trade_id')
    .in('tag_id', tagIds)

  if (error || !data) return []

  // data may be array of objects like { trade_id: number }
  return (data as Array<{ trade_id: number }>).map(r => r.trade_id)
}
