/**
 * Supabase Integration Examples
 *
 * This file demonstrates how to perform CRUD operations with Supabase.
 * Copy these patterns to integrate Supabase throughout your application.
 */

import { supabase } from './supabase'

// ============================================
// CATTLE OPERATIONS
// ============================================

/**
 * Create a new cattle record
 */
export async function createCattle(cattleData: {
  tag_number: string
  breed: string
  sex: string
  birth_date: string
  weight: number
  lot: string
  status: string
  stage: string
  health_status: string
  identification_method: string
  // ... other fields
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('cattle')
    .insert([{ ...cattleData, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all cattle for current user
 */
export async function getAllCattle() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('cattle')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'Active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single cattle by ID
 */
export async function getCattleById(id: string) {
  const { data, error } = await supabase
    .from('cattle')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Update cattle record
 */
export async function updateCattle(id: string, updates: Partial<typeof createCattle>) {
  const { data, error } = await supabase
    .from('cattle')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete cattle record
 */
export async function deleteCattle(id: string) {
  const { error } = await supabase
    .from('cattle')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get cattle by pen
 */
export async function getCattleByPen(penId: string) {
  const { data, error } = await supabase
    .from('cattle')
    .select('*')
    .eq('pen_id', penId)
    .eq('status', 'Active')

  if (error) throw error
  return data || []
}

// ============================================
// PEN & BARN OPERATIONS
// ============================================

/**
 * Create a new barn
 */
export async function createBarn(barnData: {
  name: string
  location: string
  total_pens: number
  total_capacity: number
  notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('barns')
    .insert([{ ...barnData, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all barns
 */
export async function getAllBarns() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('barns')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Create a new pen
 */
export async function createPen(penData: {
  name: string
  barn_id: string
  capacity: number
  notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('pens')
    .insert([{ ...penData, current_count: 0, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all pens (optionally filtered by barn)
 */
export async function getAllPens(barnId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  let query = supabase
    .from('pens')
    .select('*')
    .eq('user_id', user.id)

  if (barnId) {
    query = query.eq('barn_id', barnId)
  }

  const { data, error } = await query.order('name')

  if (error) throw error
  return data || []
}

// ============================================
// WEIGHT RECORDS
// ============================================

/**
 * Add weight record
 */
export async function addWeightRecord(weightData: {
  cattle_id: string
  date: string
  weight: number
  notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('weight_records')
    .insert([{ ...weightData, user_id: user.id }])
    .select()
    .single()

  if (error) throw error

  // Also update the cattle's current weight
  await supabase
    .from('cattle')
    .update({ weight: weightData.weight })
    .eq('id', weightData.cattle_id)

  return data
}

/**
 * Get weight history for a cattle
 */
export async function getWeightHistory(cattleId: string) {
  const { data, error } = await supabase
    .from('weight_records')
    .select('*')
    .eq('cattle_id', cattleId)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================
// HEALTH RECORDS
// ============================================

/**
 * Add health record
 */
export async function addHealthRecord(healthData: {
  cattle_id: string
  date: string
  type: string
  description: string
  veterinarian?: string
  cost?: number
  next_due_date?: string
  notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('health_records')
    .insert([{ ...healthData, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get health history for a cattle
 */
export async function getHealthHistory(cattleId: string) {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('cattle_id', cattleId)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// FEED INVENTORY
// ============================================

/**
 * Add feed inventory item
 */
export async function addFeedInventory(feedData: {
  name: string
  type: string
  quantity: number
  unit: string
  cost_per_unit: number
  supplier?: string
  purchase_date: string
  expiry_date?: string
  location?: string
  notes?: string
  daily_usage: number
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('feed_inventory')
    .insert([{ ...feedData, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all feed inventory
 */
export async function getAllFeedInventory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('feed_inventory')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Update feed quantity (when used)
 */
export async function updateFeedQuantity(id: string, newQuantity: number) {
  const { data, error } = await supabase
    .from('feed_inventory')
    .update({ quantity: newQuantity })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Add financial transaction
 */
export async function addTransaction(transactionData: {
  type: string
  amount: number
  date: string
  description: string
  category?: string
  cattle_id?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transactionData, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all transactions
 */
export async function getAllTransactions() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to cattle changes
 */
export function subscribeToCattleChanges(callback: (payload: any) => void) {
  const channel = supabase
    .channel('cattle-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cattle',
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to pen changes
 */
export function subscribeToPenChanges(callback: (payload: any) => void) {
  const channel = supabase
    .channel('pen-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pens',
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================
// ADVANCED QUERIES
// ============================================

/**
 * Get cattle with related data (joins)
 */
export async function getCattleWithDetails(cattleId: string) {
  const { data, error } = await supabase
    .from('cattle')
    .select(`
      *,
      pen:pens(*),
      barn:barns(*),
      weight_records(*),
      health_records(*)
    `)
    .eq('id', cattleId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get analytics data
 */
export async function getAnalytics() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get total cattle count
  const { count: totalCattle } = await supabase
    .from('cattle')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Active')

  // Get cattle by stage
  const { data: cattleByStage } = await supabase
    .from('cattle')
    .select('stage')
    .eq('user_id', user.id)
    .eq('status', 'Active')

  // Get recent weight records
  const { data: recentWeights } = await supabase
    .from('weight_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  return {
    totalCattle: totalCattle || 0,
    cattleByStage: cattleByStage || [],
    recentWeights: recentWeights || [],
  }
}

/**
 * Search cattle by tag number or name
 */
export async function searchCattle(searchTerm: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('cattle')
    .select('*')
    .eq('user_id', user.id)
    .or(`tag_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
    .eq('status', 'Active')

  if (error) throw error
  return data || []
}
