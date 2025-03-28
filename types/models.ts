import { Database } from './supabase';

// Grootboekrekening types
export type GlAccount = Database['public']['Tables']['gl_accounts']['Row'];
export type GlAccountInsert = Database['public']['Tables']['gl_accounts']['Insert'];
export type GlAccountUpdate = Database['public']['Tables']['gl_accounts']['Update'];

// Product types (SaaS en Consultancy)
export type ProductType = 'SaaS' | 'Consultancy';

export type Product = {
  id: string;
  type: ProductType;
  name: string;
  price: number;
  is_required?: boolean;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
};

// Geplande SaaS omzet
export type PlannedSaasRevenue = {
  id: string;
  product_id: string;
  month: number;
  year: number;
  users: number;
  amount: number;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
};

// Geplande Consultancy omzet
export type PlannedConsultancyRevenue = {
  id: string;
  client_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  hours_per_month: number[]; // Array van 12 maanden
  amount_per_month: number[]; // Berekend op basis van uren en tarief
  organization_id: string;
  created_at?: string;
  updated_at?: string;
};

// Budget entries
export type BudgetEntryType = 'Planned' | 'Actual';

export type BudgetEntry = {
  id: string;
  gl_account_id: string;
  month: number;
  year: number;
  amount: number;
  type: BudgetEntryType;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
};

// Hiërarchische representatie van grootboekrekeningen
export type GlAccountHierarchy = {
  hoofdgroep: GlAccount & {
    subgroepen: (GlAccount & {
      kostenposten: GlAccount[];
    })[];
  };
};

// Voor dropdown/select componenten
export type SelectOption = {
  value: string;
  label: string;
};

// Helper functie om een array van GlAccounts om te zetten naar SelectOptions
export const glAccountsToSelectOptions = (accounts: GlAccount[]): SelectOption[] => {
  return accounts.map(account => ({
    value: account.code,
    label: `${account.code} - ${account.name}`
  }));
};

// Helper functie om GlAccounts te groeperen op niveau
export const groupGlAccountsByLevel = (accounts: GlAccount[]): {
  hoofdgroepen: GlAccount[];
  subgroepen: GlAccount[];
  kostenposten: GlAccount[];
} => {
  return {
    hoofdgroepen: accounts.filter(a => a.level === 1),
    subgroepen: accounts.filter(a => a.level === 2),
    kostenposten: accounts.filter(a => a.level === 3)
  };
};

// Helper functie om kinderen van een grootboekrekening te vinden
export const findChildren = (accounts: GlAccount[], parentCode: string): GlAccount[] => {
  return accounts.filter(account => account.parent_code === parentCode);
}; 