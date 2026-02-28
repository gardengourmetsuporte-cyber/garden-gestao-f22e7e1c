import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';

interface TableData {
  id: string;
  number: number;
  status: string;
}

export default function TabletSelect() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data } = await supabase
        .from('tablet_tables')
        .select('*')
        .eq('unit_id', unitId)
        .order('number');
      setTables((data as TableData[]) || []);
      setLoading(false);
    })();
  }, [unitId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/20 px-4 py-6 text-center">
        <AppIcon name="ChefHat" className="w-12 h-12 mx-auto text-primary mb-2" />
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo!</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecione sua mesa para iniciar o pedido</p>
      </header>

      {/* Tables */}
      <main className="flex-1 px-4 py-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando mesas...</p>
        ) : tables.length === 0 ? (
          <div className="text-center py-12">
            <AppIcon name="Utensils" className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma mesa configurada</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => navigate(`/tablet/${unitId}/menu?mesa=${table.number}`)}
                disabled={table.status === 'reserved'}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-lg transition-all active:scale-95 ${
                  table.status === 'reserved'
                    ? 'bg-destructive/10 border border-destructive/20 text-destructive/50 cursor-not-allowed'
                    : table.status === 'occupied'
                    ? 'bg-warning/10 border border-warning/20 text-warning'
                    : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
                }`}
              >
                <span className="text-2xl">{table.number}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {table.status === 'available' ? 'Livre' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
