import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { EmployeePerformance } from '@/components/employees/EmployeePerformance';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';
import { TeamAchievements } from '@/components/employees/TeamAchievements';
import { SwipeableTabs } from '@/components/ui/swipeable-tabs';
import { AppIcon } from '@/components/ui/app-icon';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="page-header-bar">
          <div className="page-header-content flex items-center gap-3">
            <div className="icon-glow icon-glow-md icon-glow-primary">
              <AppIcon name="Users" size={20} />
            </div>
            <div>
              <h1 className="page-title">
                {isAdmin ? 'Funcionários' : 'Meus Dados'}
              </h1>
              <p className="page-subtitle">
                {isAdmin 
                  ? 'Gerencie funcionários, pagamentos e folgas' 
                  : 'Consulte seus holerites e solicite folgas'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          {isAdmin ? (
            selectedEmployee ? (
              <EmployeePayments
                employee={selectedEmployee}
                onBack={() => setSelectedEmployee(null)}
              />
            ) : (
              <SwipeableTabs
                tabs={[
                  {
                    key: 'employees',
                    label: 'Funcionários',
                    icon: <AppIcon name="Users" size={16} />,
                    content: <EmployeeList onSelectEmployee={setSelectedEmployee} />,
                  },
                  {
                    key: 'schedules',
                    label: 'Folgas',
                    icon: <AppIcon name="Calendar" size={16} />,
                    content: <ScheduleManagement />,
                  },
                  {
                    key: 'performance',
                    label: 'Performance',
                    icon: <AppIcon name="BarChart3" size={16} />,
                    content: <EmployeePerformance />,
                  },
                  {
                    key: 'achievements',
                    label: 'Conquistas',
                    icon: <AppIcon name="Trophy" size={16} />,
                    content: <TeamAchievements />,
                  },
                ]}
              />
            )
          ) : (
            <SwipeableTabs
              tabs={[
                {
                  key: 'payslips',
                  label: 'Holerites',
                  icon: <AppIcon name="Users" size={16} />,
                  content: <MyPayslips />,
                },
                {
                  key: 'schedules',
                  label: 'Folgas',
                  icon: <AppIcon name="Calendar" size={16} />,
                  content: <EmployeeScheduleRequest />,
                },
                {
                  key: 'achievements',
                  label: 'Conquistas',
                  icon: <AppIcon name="Trophy" size={16} />,
                  content: <TeamAchievements />,
                },
              ]}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
