// Database types matching Supabase schema
export type AppRole = 'admin' | 'funcionario';
export type UnitType = 'unidade' | 'kg' | 'litro';
export type MovementType = 'entrada' | 'saida';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id: string | null;
  unit_type: UnitType;
  current_stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
}

export interface StockMovement {
  id: string;
  item_id: string;
  type: MovementType;
  quantity: number;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  // Joined data
  item?: InventoryItem;
  profile?: Profile;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
}
