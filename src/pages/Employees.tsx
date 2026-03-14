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
               <div className={cn(
                 "grid gap-2",
                 tabs.length <= 4 ? "grid-cols-4" : tabs.length <= 6 ? "grid-cols-3" : "grid-cols-4"
               )}>
                 {tabs.map((tab) => {
                   const isActive = activeTab === tab.key;
                   return (
                     <button
                       key={tab.key}
                       onClick={() => setActiveTab(tab.key)}
                       className={cn(
                         "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-[11px] font-medium transition-all active:scale-[0.95]",
                         isActive
                           ? "bg-primary/15 text-primary"
                           : "bg-secondary/50 text-muted-foreground"
                       )}
                     >
                       <div className={cn(
                         "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                         isActive ? "bg-primary/20" : "bg-foreground/[0.05]"
                       )}>
                         <AppIcon name={tab.icon} size={18} fill={tab.iconFill as 0 | 1} className={isActive ? "text-primary" : "text-muted-foreground"} />
                       </div>
                       <span className="truncate w-full text-center">{tab.label}</span>
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
