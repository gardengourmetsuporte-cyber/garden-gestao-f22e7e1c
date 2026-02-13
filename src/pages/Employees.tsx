import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';
import { SwipeableTabs } from '@/components/ui/swipeable-tabs';
import { Users, Calendar } from 'lucide-react';

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
              <Users className="w-5 h-5" />
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
                    icon: <Users className="w-4 h-4" />,
                    content: <EmployeeList onSelectEmployee={setSelectedEmployee} />,
                  },
                  {
                    key: 'schedules',
                    label: 'Folgas',
                    icon: <Calendar className="w-4 h-4" />,
                    content: <ScheduleManagement />,
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
                  icon: <Users className="w-4 h-4" />,
                  content: <MyPayslips />,
                },
                {
                  key: 'schedules',
                  label: 'Folgas',
                  icon: <Calendar className="w-4 h-4" />,
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
