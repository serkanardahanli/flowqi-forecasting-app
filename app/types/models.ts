export type ProductType = 'SaaS' | 'Consultancy' | 'saas' | 'consultancy' | 'hardware' | 'service';

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  price: number;
  description?: string;
  is_required: boolean;
  gl_account_id: string | null;
  group_id: string | null;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface GlAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  parent_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
  products?: Product[];
} 