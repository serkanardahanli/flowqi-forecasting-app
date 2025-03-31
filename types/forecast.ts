// Typen voor forecasts en budget scenario's

export interface Forecast {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  organization_id?: string;
}

export interface BudgetScenario {
  id: string;
  name: string;
  description?: string;
  year: number;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  organization_id?: string;
} 