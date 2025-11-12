import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a dummy client if env vars aren't set (will be caught by isConfigured checks)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')
}

// Database types will be auto-generated from Supabase
export type Database = {
  public: {
    Tables: {
      cattle: {
        Row: {
          id: string
          tag_number: string
          name: string | null
          breed: string
          sex: string
          birth_date: string
          purchase_date: string | null
          purchase_price: number | null
          purchase_weight: number | null
          current_value: number | null
          weight: number
          dam: string | null
          sire: string | null
          lot: string
          pasture: string | null
          pen_id: string | null
          barn_id: string | null
          batch_id: string | null
          status: string
          stage: string
          health_status: string
          pregnancy_status: string | null
          expected_calving_date: string | null
          last_vet_visit: string | null
          notes: string | null
          color_markings: string | null
          horn_status: string | null
          identification_method: string
          rfid_tag: string | null
          brand_number: string | null
          days_on_feed: number | null
          projected_weight: number | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['cattle']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cattle']['Insert']>
      }
      pens: {
        Row: {
          id: string
          name: string
          barn_id: string
          capacity: number
          current_count: number
          notes: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['pens']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pens']['Insert']>
      }
      barns: {
        Row: {
          id: string
          name: string
          location: string
          total_pens: number
          total_capacity: number
          notes: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['barns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['barns']['Insert']>
      }
      weight_records: {
        Row: {
          id: string
          cattle_id: string
          date: string
          weight: number
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['weight_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weight_records']['Insert']>
      }
      health_records: {
        Row: {
          id: string
          cattle_id: string
          date: string
          type: string
          description: string
          veterinarian: string | null
          cost: number | null
          next_due_date: string | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['health_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['health_records']['Insert']>
      }
      feed_inventory: {
        Row: {
          id: string
          name: string
          type: string
          quantity: number
          unit: string
          cost_per_unit: number
          supplier: string | null
          purchase_date: string
          expiry_date: string | null
          location: string | null
          notes: string | null
          daily_usage: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['feed_inventory']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['feed_inventory']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          type: string
          amount: number
          date: string
          description: string
          category: string | null
          cattle_id: string | null
          created_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
    }
  }
}
