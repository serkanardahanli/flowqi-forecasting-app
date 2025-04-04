export type ProductType = 'saas' | 'hardware' | 'service';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: ProductType;
  gl_account_id?: string;
  is_required: boolean;
  group_id: string | null;
  organization_id: string;
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
} 