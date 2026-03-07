import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface BackupEntry {
  id: string;
  name: string;
  tables_included: string[];
  total_records: number;
  created_at: string;
}

const TABLE_LABELS: Record<string, string> = {
  checklist_sectors: 'Setores',
  checklist_subcategories: 'Subcategorias',
  checklist_items: 'Itens de Checklist',
  categories: 'Categorias de Estoque',
  inventory_items: 'Itens de Estoque',
  employees: 'Funcionários',
  employee_schedules: 'Escalas',
  customers: 'Clientes',
  finance_accounts: 'Contas',
  finance_categories: 'Categorias Financeiras',
  finance_transactions: 'Transações',
  finance_tags: 'Tags',
  finance_budgets: 'Orçamentos',
  credit_card_invoices: 'Faturas',
  suppliers: 'Fornecedores',
  recipes: 'Receitas',
  recipe_ingredients: 'Ingredientes',
  brand_identity: 'Identidade Visual',
  brand_assets: 'Assets da Marca',
  brand_references: 'Referências da Marca',
  access_levels: 'Níveis de Acesso',
  rewards: 'Recompensas',
  payment_method_settings: 'Métodos de Pagamento',
  loyalty_rules: 'Regras de Fidelidade',
};

export function SystemBackupSettings() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    if (!user || !activeUnitId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'list', unit_id: activeUnitId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBackups(data.backups || []);
    } catch (err: any) {
      console.error('Error fetching backups:', err);
      toast.error('Erro ao carregar backups');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeUnitId]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreate = async () => {
    if (!activeUnitId) return;
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'create', unit_id: activeUnitId, backup_name: backupName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Backup criado com ${data.backup.total_records} registros!`);
      setBackupName('');
      await fetchBackups();
    } catch (err: any) {
      console.error('Error creating backup:', err);
      toast.error('Erro ao criar backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backup: BackupEntry) => {
    if (!activeUnitId) return;
    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'restore', unit_id: activeUnitId, backup_id: backup.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Restauração concluída! Recarregue a página para ver as mudanças.');
      setRestoreTarget(null);
      setExpandedId(null);
      await fetchBackups();
    } catch (err: any) {
      console.error('Error restoring backup:', err);
      toast.error('Erro ao restaurar backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('system-backup', {
        body: { action: 'delete', unit_id: activeUnitId, backup_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Backup excluído');
      setDeleteTarget(null);
      if (expandedId === id) setExpandedId(null);
      await fetchBackups();
    } catch (err: any) {
      toast.error('Erro ao excluir backup');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Backup Geral do Sistema</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Crie backups completos de todos os dados da sua loja: checklist, estoque, financeiro, funcionários, clientes e mais.
        </p>
      </div>

      {/* Create backup */}
      <div className="card-surface rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AppIcon name="Plus" size={16} className="text-primary" />
          Novo Backup
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nome do backup (opcional)"
            value={backupName}
            onChange={e => setBackupName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCreate} disabled={isCreating} size="sm">
            {isCreating ? (
              <AppIcon name="Progress_activity" size={16} className="animate-spin" />
            ) : (
              <AppIcon name="Archive" size={16} />
            )}
            <span className="ml-1">Criar</span>
          </Button>
        </div>
        {isCreating && (
          <p className="text-xs text-muted-foreground animate-pulse">
            Salvando todos os dados... isso pode levar alguns segundos.
          </p>
        )}
      </div>

      {/* Backup list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <AppIcon name="Progress_activity" size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AppIcon name="Archive" size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum backup ainda</p>
          <p className="text-xs mt-1">Crie um backup para proteger todos os dados da sua loja</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map(backup => {
            const isExpanded = expandedId === backup.id;

            return (
              <div key={backup.id} className="border rounded-xl overflow-hidden bg-card">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : backup.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {backup.name || 'Backup sem nome'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' · '}
                      {backup.total_records} registros
                      {' · '}
                      {backup.tables_included.length} tabelas
                    </p>
                  </div>
                  <AppIcon
                    name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                </button>

                {isExpanded && (
                  <div className="border-t px-3 py-3 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                      <AppIcon name="Database" size={12} />
                      Dados incluídos neste backup
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {backup.tables_included.map(table => (
                        <span
                          key={table}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                        >
                          {TABLE_LABELS[table] || table}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setRestoreTarget(backup)}
                        disabled={isRestoring}
                      >
                        {isRestoring ? (
                          <AppIcon name="Progress_activity" size={16} className="animate-spin mr-1" />
                        ) : (
                          <AppIcon name="RefreshCw" size={16} className="mr-1" />
                        )}
                        Restaurar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(backup.id)}
                      >
                        <AppIcon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={open => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar backup completo?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai substituir <strong>todos os dados</strong> da sua loja (checklist, estoque, financeiro, funcionários, clientes, etc.) pelo conteúdo deste backup.
              <br /><br />
              Um backup automático do estado atual será criado antes da restauração.
              <br /><br />
              <strong>Esta ação é irreversível.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => restoreTarget && handleRestore(restoreTarget)}
            >
              Sim, restaurar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Este backup será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
