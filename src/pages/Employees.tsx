import { useState, useRef, useCallback } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { useFabAction } from '@/contexts/FabActionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';
import { TimeTracking } from '@/components/employees/TimeTracking';
import { EmployeeWarnings } from '@/components/employees/EmployeeWarnings';
import { HourBankManager } from '@/components/employees/HourBankManager';
import { MaterialDeliveries } from '@/components/employees/MaterialDeliveries';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('employees');
  const openMaterialRef = useRef<(() => void) | null>(null);
  useScrollToTopOnChange(activeTab);

  useFabAction(
    activeTab === 'deliveries' ? { icon: 'Plus', label: 'Registrar', onClick: () => openMaterialRef.current?.() } : null,
    [activeTab]
  );

  const adminTabs = [
    { key: 'employees', label: 'Funcionários', icon: 'Users', iconFill: 1 },
    { key: 'time-tracking', label: 'Ponto', icon: 'Clock', iconFill: 1 },
    { key: 'schedules', label: 'Folgas', icon: 'Calendar', iconFill: 1 },
    { key: 'deliveries', label: 'Entregas', icon: 'Package', iconFill: 1 },
    { key: 'warnings', label: 'Advertências', icon: 'AlertTriangle', iconFill: 0 },
    { key: 'hour-bank', label: 'Banco Horas', icon: 'Timer', iconFill: 1 },
  ];

  const employeeTabs = [
    { key: 'time-tracking', label: 'Ponto', icon: 'Clock', iconFill: 1 },
    { key: 'payslips', label: 'Holerites', icon: 'FileText', iconFill: 1 },
    { key: 'schedules', label: 'Folgas', icon: 'Calendar', iconFill: 1 },
    { key: 'warnings', label: 'Advertências', icon: 'AlertTriangle', iconFill: 0 },
  ];

  const tabs = isAdmin ? adminTabs : employeeTabs;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <div className="px-4 py-3 lg:px-8 lg:max-w-6xl lg:mx-auto space-y-4">
          {isAdmin && selectedEmployee ? (
            <EmployeePayments
              employee={selectedEmployee}
              onBack={() => setSelectedEmployee(null)}
            />
          ) : (
            <>
              {/* Navigation Cards */}
              <div className="grid grid-cols-3 gap-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1.5 py-3 px-1.5 rounded-2xl border transition-all duration-200 active:scale-[0.97] min-w-0 overflow-hidden",
                        isActive
                          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
                          : "bg-card border-border hover:border-primary/20"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isActive ? "bg-primary/20" : "bg-primary/10")}>
                        <AppIcon name={tab.icon} size={20} fill={tab.iconFill ?? 1} className={isActive ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <span className={cn("text-[10px] font-semibold truncate w-full text-center", isActive ? "text-primary" : "text-muted-foreground")}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'employees' && isAdmin && <EmployeeList onSelectEmployee={setSelectedEmployee} />}
                {activeTab === 'time-tracking' && <TimeTracking />}
                {activeTab === 'schedules' && (isAdmin ? <ScheduleManagement /> : <EmployeeScheduleRequest />)}
                {activeTab === 'payslips' && !isAdmin && <MyPayslips />}
                {activeTab === 'deliveries' && isAdmin && <MaterialDeliveries onRegisterRef={(fn) => { openMaterialRef.current = fn; }} />}
                {activeTab === 'warnings' && <EmployeeWarnings />}
                {activeTab === 'hour-bank' && isAdmin && <HourBankManager />}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
