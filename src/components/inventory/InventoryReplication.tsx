import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function InventoryReplication() {
  const { activeUnitId, units } = useUnit();
  const [sourceUnitId, setSourceUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ categories: number; items: number } | null>(null);

  const otherUnits = units.filter(u => u.id !== activeUnitId);

  const handleReplicate = async () => {
    if (!activeUnitId || !sourceUnitId) return;
    setLoading(true);
    setResult(null);

    try {
      // 1. Fetch source categories and items
      const [catRes, itemRes] = await Promise.all([
        supabase.from('categories').select('*').eq('unit_id', sourceUnitId).order('sort_order'),
        supabase.from('inventory_items').select('*').eq('unit_id', sourceUnitId).is('deleted_at' as any, null).order('name'),
      ]);

      const cats = catRes.data || [];
      const items = itemRes.data || [];

      // 2. Get existing categories in target to avoid duplicates
      const { data: existingCats } = await supabase
        .from('categories')
        .select('id, name')
        .eq('unit_id', activeUnitId);

      const existingCatNames = new Set((existingCats || []).map(c => c.name.toLowerCase()));

      // 3. Insert new categories, mapping old IDs to new
      const catIdMap: Record<string, string> = {};
      
      for (const cat of cats) {
        if (existingCatNames.has(cat.name.toLowerCase())) {
          // Map to existing category
          const existing = (existingCats || []).find(c => c.name.toLowerCase() === cat.name.toLowerCase());
          if (existing) catIdMap[cat.id] = existing.id;
          continue;
        }

        const { data: newCat } = await supabase.from('categories').insert({
          unit_id: activeUnitId,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          sort_order: cat.sort_order,
        }).select('id').single();

        if (newCat) catIdMap[cat.id] = newCat.id;
      }

      // 4. Get existing item names in target to avoid duplicates
      const { data: existingItems } = await supabase
        .from('inventory_items')
        .select('name')
        .eq('unit_id', activeUnitId)
        .is('deleted_at' as any, null);

      const existingItemNames = new Set((existingItems || []).map(i => (i as any).name?.toLowerCase()));

      // 5. Insert items (skip duplicates by name)
      let insertedCount = 0;
      for (const item of items) {
        if (existingItemNames.has(item.name?.toLowerCase())) continue;

        await supabase.from('inventory_items').insert({
          unit_id: activeUnitId,
          name: item.name,
          category_id: item.category_id ? catIdMap[item.category_id] || null : null,
          supplier_id: null, // Suppliers are unit-specific, don't copy
          unit_type: item.unit_type,
          current_stock: 0, // Start fresh
          min_stock: item.min_stock,
          unit_price: item.unit_price || 0,
        } as any);
        insertedCount++;
      }

      const newCatsCount = Object.keys(catIdMap).length;
      setResult({ categories: newCatsCount, items: insertedCount });
      toast.success('Produtos e categorias importados com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao importar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (otherUnits.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você precisa ter mais de uma unidade para importar produtos.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Importar Produtos de Outra Unidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Copie categorias e produtos de estoque de outra unidade para a unidade atual. 
          Itens duplicados (mesmo nome) serão ignorados. O estoque inicia zerado.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select value={sourceUnitId} onValueChange={setSourceUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade de origem" />
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
            <Button disabled={!sourceUnitId || loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Importar Produtos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Importação</AlertDialogTitle>
              <AlertDialogDescription>
                Categorias e produtos da unidade selecionada serão copiados para a unidade atual.
                Itens com nomes duplicados serão ignorados. O estoque dos novos itens começará zerado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReplicate}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {result && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Importado: {result.categories} categorias, {result.items} produtos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
