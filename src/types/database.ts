// Database types matching Supabase schema
export type AppRole = 'admin' | 'funcionario' | 'super_admin';
export type UnitType = 'unidade' | 'kg' | 'litro';
export type MovementType = 'entrada' | 'saida';
export type OrderStatus = 'draft' | 'sent' | 'received' | 'cancelled';
export type ChecklistType = 'abertura' | 'fechamento';
export type ScheduleStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
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
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id: string | null;
  supplier_id: string | null;
  unit_type: UnitType;
  unit_price: number | null;
  current_stock: number;
  min_stock: number;
  recipe_unit_type: string | null;
  recipe_unit_price: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  supplier?: Supplier;
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

export interface Order {
  id: string;
  supplier_id: string;
  status: OrderStatus;
  notes: string | null;
  sent_at: string | null;
  created_by: string | null;
  supplier_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  supplier?: Supplier;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  // Joined data
  item?: InventoryItem;
}

// Checklist types
export interface ChecklistSector {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined data
  subcategories?: ChecklistSubcategory[];
}

export interface ChecklistSubcategory {
  id: string;
  sector_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined data
  sector?: ChecklistSector;
  items?: ChecklistItem[];
}

export type ItemFrequency = 'daily' | 'weekly' | 'monthly';

export interface ChecklistItem {
  id: string;
  subcategory_id: string;
  name: string;
  description: string | null;
  frequency: ItemFrequency;
  checklist_type: ChecklistType;
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
  points: number; // 0 = no points, 1-4 = configurable points
  created_at: string;
  updated_at: string;
  // Joined data
  subcategory?: ChecklistSubcategory;
}

export interface ChecklistCompletion {
  id: string;
  item_id: string;
  checklist_type: ChecklistType;
  completed_by: string;
  completed_at: string;
  notes: string | null;
  date: string;
  awarded_points: boolean;
  points_awarded: number; // 1-4 stars, 0 means "already done"
  // Joined data
  item?: ChecklistItem;
  profile?: Profile;
}

// Work Schedule types
export interface WorkSchedule {
  id: string;
  user_id: string;
  month: number;
  year: number;
  day_off: number;
  status: ScheduleStatus;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
  approver_profile?: Profile;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
}

// Reward types
export type RewardStatus = 'pending' | 'approved' | 'delivered' | 'cancelled';

export interface RewardProduct {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  product_id: string;
  points_spent: number;
  status: RewardStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: RewardProduct;
  profile?: Profile;
}
