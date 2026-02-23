import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useUsers } from '@/hooks/useUsers';
import { Employee } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { EmployeeSheet } from './EmployeeSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmployeeListProps {
  onSelectEmployee: (employee: Employee) => void;
}

export function EmployeeList({ onSelectEmployee }: EmployeeListProps) {
  const { employees, isLoading, deleteEmployee, updateEmployee } = useEmployees();
  const { users } = useUsers();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = showInactive ? true : emp.is_active;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEmployee(deleteId);
      setDeleteId(null);
    }
  };

  const toggleActive = async (employee: Employee) => {
    await updateEmployee({
      id: employee.id,
      is_active: !employee.is_active,
    });
  };

  const availableUsers = users.filter(
    u => !employees.some(e => e.user_id === u.user_id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditingEmployee(null); setSheetOpen(true); }}>
          <AppIcon name="Plus" size={16} className="mr-2" />
          Novo
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? 'Mostrando inativos' : 'Mostrar inativos'}
        </Button>
        <span className="text-sm text-muted-foreground">
          {filteredEmployees.length} funcionário(s)
        </span>
      </div>

      <div className="space-y-2">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="card-unified-interactive p-4 cursor-pointer"
            onClick={() => onSelectEmployee(employee)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AppIcon name="User" size={20} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{employee.full_name}</span>
                    {!employee.is_active && (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                    {employee.user_id && (
                      <Badge variant="outline" className="text-xs">
                        <AppIcon name="UserCheck" size={12} className="mr-1" />
                        Vinculado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {employee.role && (
                      <span className="flex items-center gap-1">
                        <AppIcon name="Briefcase" size={12} />
                        {employee.role}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <AppIcon name="DollarSign" size={12} />
                      {formatCurrency(employee.base_salary)}
                    </span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <AppIcon name="MoreVertical" size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(employee); }}>
                    <AppIcon name="Pencil" size={16} className="mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleActive(employee); }}>
                    {employee.is_active ? (
                      <>
                        <AppIcon name="person_off" size={16} className="mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <AppIcon name="UserCheck" size={16} className="mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); setDeleteId(employee.id); }}
                    className="text-destructive"
                  >
                    <AppIcon name="Trash2" size={16} className="mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AppIcon name="User" size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum funcionário encontrado</p>
          </div>
        )}
      </div>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={editingEmployee}
        availableUsers={availableUsers}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os registros de pagamento serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
