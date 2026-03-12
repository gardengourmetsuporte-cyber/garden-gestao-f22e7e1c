import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Customer } from '@/types/customer';

interface CustomerLGPDProps {
  customer: Customer;
  onDeleted: () => void;
}

export function CustomerLGPD({ customer, onDeleted }: CustomerLGPDProps) {
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Gather all customer data
      const [
        { data: orders },
        { data: addresses },
        { data: reviews },
      ] = await Promise.all([
        supabase.from('pos_sales').select('*').or(`customer_name.eq.${customer.name},customer_phone.eq.${customer.phone || ''}`).limit(500),
        supabase.from('customer_addresses').select('*').eq('customer_id', customer.id),
        supabase.from('customer_reviews').select('*').eq('customer_name', customer.name).eq('unit_id', customer.unit_id),
      ]);

      const exportData = {
        dados_pessoais: {
          nome: customer.name,
          email: customer.email,
          telefone: customer.phone,
          aniversario: customer.birthday,
          endereco: customer.address,
          segmento: customer.segment,
          notas: customer.notes,
          tags: customer.tags,
          pontos_fidelidade: customer.loyalty_points,
          total_gasto: customer.total_spent,
          total_pedidos: customer.total_orders,
          criado_em: customer.created_at,
        },
        enderecos: addresses || [],
        historico_pedidos: (orders || []).map(o => ({
          id: o.id,
          total: o.total,
          data: o.created_at,
          status: o.status,
        })),
        avaliacoes: reviews || [],
        exportado_em: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dados-cliente-${customer.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso (LGPD)');
    } catch {
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Anonymize customer data instead of hard delete
      await supabase.from('customers').update({
        name: 'Cliente Removido (LGPD)',
        email: null,
        phone: null,
        birthday: null,
        address: null,
        notes: null,
        tags: null,
        deleted_at: new Date().toISOString(),
      }).eq('id', customer.id);

      // Delete addresses
      await supabase.from('customer_addresses').delete().eq('customer_id', customer.id);

      toast.success('Dados do cliente anonimizados com sucesso (LGPD)');
      onDeleted();
    } catch {
      toast.error('Erro ao anonimizar dados');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AppIcon name="ShieldCheck" size={14} />
        <span>Direitos LGPD do titular</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="text-xs gap-1.5"
        >
          <AppIcon name="Download" size={14} />
          {exporting ? 'Exportando...' : 'Exportar Dados'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="text-xs gap-1.5 text-destructive hover:text-destructive"
        >
          <AppIcon name="Trash2" size={14} />
          Anonimizar Dados
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anonimizar dados do cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Em conformidade com a LGPD, os dados pessoais serão permanentemente
              anonimizados. O histórico de pedidos será mantido sem identificação.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Anonimizando...' : 'Confirmar Anonimização'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
