import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChecklistItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/app-icon';

interface ChecklistTrashProps {
  fetchDeletedItems: () => Promise<ChecklistItem[]>;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

export function ChecklistTrash({
  fetchDeletedItems,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}: ChecklistTrashProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDeletedItems();
    }
  }, [isOpen]);

  const loadDeletedItems = async () => {
    setIsLoading(true);
    try {
      const items = await fetchDeletedItems();
      setDeletedItems(items);
    } catch (error) {
      toast.error('Erro ao carregar itens excluídos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await onRestore(id);
      setDeletedItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      toast.error('Erro ao restaurar item');
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await onPermanentDelete(confirmDeleteId);
      setDeletedItems(prev => prev.filter(item => item.id !== confirmDeleteId));
    } catch (error) {
      toast.error('Erro ao excluir item');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await onEmptyTrash();
      setDeletedItems([]);
    } catch (error) {
      toast.error('Erro ao esvaziar lixeira');
    } finally {
      setConfirmEmptyOpen(false);
    }
  };

  const getDeletedTimeAgo = (deletedAt: string | null) => {
    if (!deletedAt) return '';
    return formatDistanceToNow(new Date(deletedAt), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <AppIcon name="Trash2" className="w-4 h-4" />
            Lixeira
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Trash2" className="w-5 h-5" />
              Lixeira
            </SheetTitle>
          </SheetHeader>

          <p className="text-sm text-muted-foreground mb-4">
            Itens excluídos nos últimos 30 dias. Após esse período, serão removidos permanentemente.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deletedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AppIcon name="Trash2" className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Lixeira vazia</p>
              <p className="text-sm mt-1">Nenhum item excluído recentemente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedItems.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Excluído {getDeletedTimeAgo(item.deleted_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      className="gap-1.5"
                    >
                      <AppIcon name="RotateCcw" className="w-3.5 h-3.5" />
                      Restaurar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="gap-1.5"
                    >
                      <AppIcon name="Trash2" className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {deletedItems.length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmEmptyOpen(true)}
                    className="w-full gap-2"
                  >
                    <AppIcon name="Trash2" className="w-4 h-4" />
                    Esvaziar Lixeira
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm permanent delete */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AppIcon name="AlertTriangle" className="w-5 h-5 text-destructive" />
              Excluir permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm empty trash */}
      <AlertDialog open={confirmEmptyOpen} onOpenChange={setConfirmEmptyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AppIcon name="AlertTriangle" className="w-5 h-5 text-destructive" />
              Esvaziar lixeira?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todos os {deletedItems.length} itens na lixeira serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Esvaziar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
