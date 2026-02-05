// Agenda module types

export type DayPeriod = 'morning' | 'afternoon' | 'evening';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ManagerTask {
  id: string;
  user_id: string;
  title: string;
  notes?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  priority: TaskPriority;
  is_completed: boolean;
  completed_at: string | null;
  category_id?: string | null;
  category?: TaskCategory | null;
  created_at: string;
  updated_at: string;
  // Deprecated fields kept for backward compatibility
  period?: DayPeriod;
  date?: string;
  is_system_generated?: boolean;
  system_source?: string | null;
  source_data?: Record<string, unknown> | null;
}

export interface ManagerAppointment {
  id: string;
  user_id: string;
  title: string;
  scheduled_time: string;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface SystemAlert {
  type: 'inventory' | 'checklist' | 'rewards';
  message: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
  onClick?: () => void;
}

export interface AIContext {
  criticalStockCount: number;
  zeroStockCount: number;
  pendingRedemptions: number;
  pendingTasks: number;
  completedTasks: number;
  checklistOpeningStatus: string;
  checklistClosingStatus: string;
  dayOfWeek: string;
  timeOfDay: string;
  userQuestion?: string;
}
