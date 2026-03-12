import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function MenuReplication() {
  const { activeUnitId, units } = useUnit();
  const [targetUnitId, setTargetUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ categories: number; groups: number; products: number } | null>(null);

  const otherUnits = units.filter(u => u.id !== activeUnitId);

  const handleReplicate = async () => {
    if (!activeUnitId || !targetUnitId) return;
    setLoading(true);
    setResult(null);

    try {
      // 1. Fetch source data
      const [catRes, grpRes, prodRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('unit_id', activeUnitId),
        supabase.from('menu_groups').select('*').eq('unit_id', activeUnitId),
        supabase.from('tablet_products').select('*').eq('unit_id', activeUnitId),
      ]);

      const cats = catRes.data || [];
      const grps = grpRes.data || [];
      const prods = prodRes.data || [];

      // 2. Delete existing menu in target
      await supabase.from('tablet_products').delete().eq('unit_id', targetUnitId);
      await supabase.from('menu_groups').delete().eq('unit_id', targetUnitId);
      await supabase.from('menu_categories').delete().eq('unit_id', targetUnitId);

      // 3. Insert categories, mapping old IDs to new
      const catIdMap: Record<string, string> = {};
      for (const cat of cats) {
        const { data: newCat } = await supabase.from('menu_categories').insert({
          unit_id: targetUnitId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          sort_order: cat.sort_order,
          is_active: cat.is_active,
        }).select('id').single();
        if (newCat) catIdMap[cat.id] = newCat.id;
      }

      // 4. Insert groups
      const grpIdMap: Record<string, string> = {};
      for (const grp of grps) {
        const newCatId = catIdMap[grp.category_id];
        if (!newCatId) continue;
        const { data: newGrp } = await supabase.from('menu_groups').insert({
          unit_id: targetUnitId,
          name: grp.name,
          category_id: newCatId,
          description: grp.description,
          availability: grp.availability,
          sort_order: grp.sort_order,
          is_active: grp.is_active,
        }).select('id').single();
        if (newGrp) grpIdMap[grp.id] = newGrp.id;
      }

      // 5. Insert products
      for (const prod of prods) {
        await supabase.from('tablet_products').insert({
          unit_id: targetUnitId,
          name: prod.name,
          price: prod.price,
          coin_price: prod.coin_price,
          codigo_pdv: prod.codigo_pdv,
          category: prod.category,
          description: prod.description,
          sort_order: prod.sort_order,
          is_active: prod.is_active,
          group_id: prod.group_id ? grpIdMap[prod.group_id] || null : null,
          is_highlighted: prod.is_highlighted,
          is_18_plus: prod.is_18_plus,
          availability: prod.availability,
          price_type: prod.price_type,
          custom_prices: prod.custom_prices,
        });
      }

      // 6. Log replication
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('menu_replication_logs').insert({
        source_unit_id: activeUnitId,
        target_unit_id: targetUnitId,
        replicated_by: userData.user?.id || '',
        categories_count: cats.length,
        groups_count: grps.length,
        products_count: prods.length,
      } as any);

      setResult({ categories: cats.length, groups: grps.length, products: prods.length });
      toast.success('Cardápio replicado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao replicar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (otherUnits.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você precisa ter mais de uma unidade para replicar o cardápio.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Replicar Cardápio para Outra Unidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Copie categorias, grupos e produtos da unidade atual para outra unidade. 
          O cardápio existente na unidade destino será substituído.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select value={targetUnitId} onValueChange={setTargetUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade destino" />
              </SelectTrigger>
              <SelectContent>
                {otherUnits.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!targetUnitId || loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Replicar Cardápio
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Replicação</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá substituir TODO o cardápio da unidade destino. 
                Categorias, grupos e produtos existentes serão removidos. 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReplicate}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {result && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Replicado: {result.categories} categorias, {result.groups} grupos, {result.products} produtos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
