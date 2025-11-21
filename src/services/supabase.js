import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email, password) => {
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
export const fetchTrades = async (userId, filters = {}) => {
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
    query = query.in('id', selectTradeIdsByTags(filters.tags))
  }

  const { data, error } = await query
  return { data, error }
}

export const addTrade = async (trade) => {
  const { data, error } = await supabase
    .from('trades')
    .insert(trade)
    .select()
    .single()

  return { data, error }
}

export const updateTrade = async (id, updates) => {
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

export const deleteTrade = async (id) => {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)

  return { error }
}

// Tag operations
export const fetchTags = async (userId) => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  return { data, error }
}

export const addTag = async (tag) => {
  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single()

  return { data, error }
}

export const assignTagsToTrade = async (tradeId, tagIds) => {
  const assignments = tagIds.map(tagId => ({
    trade_id: tradeId,
    tag_id: tagId
  }))

  const { error } = await supabase
    .from('trade_tags')
    .insert(assignments)

  return { error }
}

export const removeTagFromTrade = async (tradeId, tagId) => {
  const { error } = await supabase
    .from('trade_tags')
    .delete()
    .eq('trade_id', tradeId)
    .eq('tag_id', tagId)

  return { error }
}

// Template operations
export const fetchTemplates = async (userId) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const addTemplate = async (template) => {
  const { data, error } = await supabase
    .from('templates')
    .insert(template)
    .select()
    .single()

  return { data, error }
}

export const updateTemplate = async (id, updates) => {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export const deleteTemplate = async (id) => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)

  return { error }
}

// Helper to get trade IDs that match tag filters
const selectTradeIdsByTags = (tagIds) => {
  return supabase
    .from('trade_tags')
    .select('trade_id')
    .in('tag_id', tagIds)
}
