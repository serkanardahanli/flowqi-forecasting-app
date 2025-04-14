export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      forecasts: {
        Row: {
          id: string;
          name: string;
          organization_id: string;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          organization_id: string;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          organization_id?: string;
          start_date?: string;
          end_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_scenarios: {
        Row: {
          id: string;
          name: string;
          organization_id: string;
          year: number;
          type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          organization_id: string;
          year: number;
          type: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          organization_id?: string;
          year?: number;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_income: {
        Row: {
          id: string;
          organization_id: string;
          scenario_id: string;
          year: number;
          month: number;
          type: string;
          client?: string | null;
          project?: string | null;
          hours?: number | null;
          rate?: number | null;
          amount: number;
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          scenario_id: string;
          year: number;
          month: number;
          type: string;
          client?: string | null;
          project?: string | null;
          hours?: number | null;
          rate?: number | null;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          scenario_id?: string;
          year?: number;
          month?: number;
          type?: string;
          client?: string | null;
          project?: string | null;
          hours?: number | null;
          rate?: number | null;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_expenses: {
        Row: {
          id: string;
          organization_id: string;
          scenario_id: string;
          year: number;
          month: number;
          cost_category: string;
          sub_category?: string | null;
          amount: number;
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          scenario_id: string;
          year: number;
          month: number;
          cost_category: string;
          sub_category?: string | null;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          scenario_id?: string;
          year?: number;
          month?: number;
          cost_category?: string;
          sub_category?: string | null;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      actual_income: {
        Row: {
          id: string;
          organization_id: string;
          year: number;
          month: number;
          type: string;
          client?: string | null;
          project?: string | null;
          hours?: number | null;
          rate?: number | null;
          amount: number;
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          year: number;
          month: number;
          type: string;
          client?: string | null;
          project?: string | null;
          hours?: number | null;
          rate?: number | null;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          year?: number;
          month?: number;
          type?: string;
          client?: string | null;
          project?: string | null;
          hours?: number | null;
          rate?: number | null;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      actual_expenses: {
        Row: {
          id: string;
          organization_id: string;
          year: number;
          month: number;
          cost_category: string;
          sub_category?: string | null;
          amount: number;
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          year: number;
          month: number;
          cost_category: string;
          sub_category?: string | null;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          year?: number;
          month?: number;
          cost_category?: string;
          sub_category?: string | null;
          amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_kpis: {
        Row: {
          id: string;
          organization_id: string;
          scenario_id: string;
          year: number;
          name: string;
          target_value: number;
          actual_value?: number | null;
          unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          scenario_id: string;
          year: number;
          name: string;
          target_value: number;
          actual_value?: number | null;
          unit: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          scenario_id?: string;
          year?: number;
          name?: string;
          target_value?: number;
          actual_value?: number | null;
          unit?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      exact_tokens: {
        Row: {
          id: string;
          organization_id: string;
          access_token: string;
          refresh_token: string;
          expires_in: number;
          token_type: string;
          division: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          access_token: string;
          refresh_token: string;
          expires_in: number;
          token_type: string;
          division: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          token_type?: string;
          division?: number;
          created_at?: string;
        };
      };
      exact_sync_logs: {
        Row: {
          id: string;
          organization_id: string;
          sync_type: string;
          status: string;
          start_date: string;
          end_date: string | null;
          records_processed: number;
          records_created: number;
          records_updated: number;
          records_failed: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sync_type: string;
          status: string;
          start_date: string;
          end_date?: string | null;
          records_processed: number;
          records_created: number;
          records_updated: number;
          records_failed: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          sync_type?: string;
          status?: string;
          start_date?: string;
          end_date?: string | null;
          records_processed?: number;
          records_created?: number;
          records_updated?: number;
          records_failed?: number;
          error_message?: string | null;
          created_at?: string;
        };
      };
      gl_accounts: {
        Row: {
          id: string;
          organization_id: string;
          code: string;
          name: string;
          type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          code: string;
          name: string;
          type: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          code?: string;
          name?: string;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    }
  }
} 