import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';

import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';

import { TimeTracking } from '@/components/employees/TimeTracking';
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
          <div className="page-header-content">
            <h1 className="page-title">{isAdmin ? 'Funcionários' : 'Meus Dados'}</h1>
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
                    key: 'time-tracking',
                    label: 'Ponto',
                    icon: <AppIcon name="Clock" size={16} />,
                    content: <TimeTracking />,
                  },
                  {
                    key: 'schedules',
                    label: 'Folgas',
                    icon: <AppIcon name="Calendar" size={16} />,
                    content: <ScheduleManagement />,
                  },
                ]}
              />
            )
          ) : (
            <SwipeableTabs
              tabs={[
                {
                  key: 'time-tracking',
                  label: 'Ponto',
                  icon: <AppIcon name="Clock" size={16} />,
                  content: <TimeTracking />,
                },
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
              ]}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
