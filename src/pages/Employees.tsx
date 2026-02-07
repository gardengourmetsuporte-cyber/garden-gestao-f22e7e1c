import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { Users } from 'lucide-react';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="page-header-unified">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isAdmin ? 'Funcionários' : 'Meus Pagamentos'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin 
                  ? 'Gerencie funcionários e pagamentos' 
                  : 'Consulte seus holerites e vales'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {isAdmin ? (
            selectedEmployee ? (
              <EmployeePayments
                employee={selectedEmployee}
                onBack={() => setSelectedEmployee(null)}
              />
            ) : (
              <EmployeeList onSelectEmployee={setSelectedEmployee} />
            )
          ) : (
            <MyPayslips />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
