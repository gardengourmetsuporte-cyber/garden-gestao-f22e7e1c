export type CustomerSegment = 'vip' | 'frequent' | 'occasional' | 'inactive' | 'new';

export interface Customer {
  id: string;
  unit_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  origin: 'manual' | 'pdv' | 'mesa' | 'ifood' | 'whatsapp' | 'csv';
  notes: string | null;
  total_spent: number;
  total_orders: number;
  last_purchase_at: string | null;
  birthday: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  segment: CustomerSegment;
  score: number;
  loyalty_points: number;
  visit_frequency_days: number | null;
  tags: string[];
}

export interface LoyaltyRule {
  id: string;
  unit_id: string;
  rule_type: 'orders_for_free' | 'points_per_real' | 'birthday_discount';
  threshold: number;
  reward_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyEvent {
  id: string;
  customer_id: string;
  unit_id: string;
  type: 'earn' | 'redeem' | 'birthday_bonus';
  points: number;
  description: string | null;
  created_at: string;
}

export const SEGMENT_CONFIG: Record<CustomerSegment, { label: string; color: string; icon: string; bg: string }> = {
  vip: { label: 'VIP', color: 'text-success', icon: 'diamond', bg: 'bg-success/10' },
  frequent: { label: 'Frequente', color: 'text-primary', icon: 'trending_up', bg: 'bg-primary/10' },
  occasional: { label: 'Ocasional', color: 'text-warning', icon: 'schedule', bg: 'bg-warning/10' },
  inactive: { label: 'Inativo', color: 'text-destructive', icon: 'warning', bg: 'bg-destructive/10' },
  new: { label: 'Novo', color: 'text-muted-foreground', icon: 'person_add', bg: 'bg-secondary' },
};
