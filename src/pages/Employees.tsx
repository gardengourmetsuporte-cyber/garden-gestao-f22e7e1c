import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';
import { Users, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                {isAdmin ? 'Funcionários' : 'Meus Dados'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin 
                  ? 'Gerencie funcionários, pagamentos e folgas' 
                  : 'Consulte seus holerites e solicite folgas'}
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
              <Tabs defaultValue="employees" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="employees">
                    <Users className="w-4 h-4 mr-2" />
                    Funcionários
                  </TabsTrigger>
                  <TabsTrigger value="schedules">
                    <Calendar className="w-4 h-4 mr-2" />
                    Folgas
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="employees">
                  <EmployeeList onSelectEmployee={setSelectedEmployee} />
                </TabsContent>
                <TabsContent value="schedules">
                  <ScheduleManagement />
                </TabsContent>
              </Tabs>
            )
          ) : (
            <Tabs defaultValue="payslips" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="payslips">
                  <Users className="w-4 h-4 mr-2" />
                  Holerites
                </TabsTrigger>
                <TabsTrigger value="schedules">
                  <Calendar className="w-4 h-4 mr-2" />
                  Folgas
                </TabsTrigger>
              </TabsList>
              <TabsContent value="payslips">
                <MyPayslips />
              </TabsContent>
              <TabsContent value="schedules">
                <EmployeeScheduleRequest />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
