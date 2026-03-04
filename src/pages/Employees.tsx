import { useState } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';
import { TimeTracking } from '@/components/employees/TimeTracking';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('employees');
  useScrollToTopOnChange(activeTab);

  const adminTabs = [
    { key: 'employees', label: 'Funcionários', icon: 'Users', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'time-tracking', label: 'Ponto', icon: 'Clock', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'schedules', label: 'Folgas', icon: 'Calendar', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const employeeTabs = [
    { key: 'time-tracking', label: 'Ponto', icon: 'Clock', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'payslips', label: 'Holerites', icon: 'FileText', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'schedules', label: 'Folgas', icon: 'Calendar', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const tabs = isAdmin ? adminTabs : employeeTabs;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {isAdmin && selectedEmployee ? (
            <EmployeePayments
              employee={selectedEmployee}
              onBack={() => setSelectedEmployee(null)}
            />
          ) : (
            <>
              {/* Navigation Cards */}
              <div className={cn("grid gap-3", tabs.length <= 3 ? "grid-cols-3" : "grid-cols-2")}>
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97]",
                      activeTab === tab.key
                        ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
                        : "bg-card border-border hover:border-primary/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activeTab === tab.key ? "bg-primary/20" : tab.bg)}>
                      <AppIcon name={tab.icon} size={20} className={activeTab === tab.key ? "text-primary" : tab.color} />
                    </div>
                    <span className={cn("text-sm font-semibold", activeTab === tab.key ? "text-primary" : "text-foreground")}>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'employees' && isAdmin && <EmployeeList onSelectEmployee={setSelectedEmployee} />}
                {activeTab === 'time-tracking' && <TimeTracking />}
                {activeTab === 'schedules' && (isAdmin ? <ScheduleManagement /> : <EmployeeScheduleRequest />)}
                {activeTab === 'payslips' && !isAdmin && <MyPayslips />}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
