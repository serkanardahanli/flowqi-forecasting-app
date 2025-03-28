export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      gl_accounts: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          parent_code: string | null
          level: number
          category: string | null
          type: 'Inkomsten' | 'Uitgaven' | 'Balans'
          balans_type: 'Winst & Verlies' | 'Balans'
          debet_credit: 'Debet' | 'Credit'
          is_blocked: boolean
          is_compressed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
          name: string
          parent_code?: string | null
          level: number
          category?: string | null
          type: 'Inkomsten' | 'Uitgaven' | 'Balans'
          balans_type: 'Winst & Verlies' | 'Balans'
          debet_credit: 'Debet' | 'Credit'
          is_blocked?: boolean
          is_compressed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          name?: string
          parent_code?: string | null
          level?: number
          category?: string | null
          type?: 'Inkomsten' | 'Uitgaven' | 'Balans'
          balans_type?: 'Winst & Verlies' | 'Balans'
          debet_credit?: 'Debet' | 'Credit'
          is_blocked?: boolean
          is_compressed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_users: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 