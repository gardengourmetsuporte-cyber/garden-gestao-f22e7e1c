// Agenda module types

export type DayPeriod = 'morning' | 'afternoon' | 'evening';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ManagerTask {
  id: string;
  user_id: string;
  title: string;
  period: DayPeriod;
  priority: TaskPriority;
  is_completed: boolean;
  is_system_generated: boolean;
  system_source: string | null;
  source_data: Record<string, unknown> | null;
  date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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
