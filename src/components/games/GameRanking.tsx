import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, User } from 'lucide-react';

interface RankEntry {
  id: string;
  score: number;
  customer_name: string;
  created_at: string;
}

interface Props {
  unitId: string;
  gameType: 'snake' | 'memory';
  onClose: () => void;
  accentColor: string; // e.g. 'emerald' or 'amber'
}

const PRIZES = [
  { coins: 50, label: '50 coins' },
  { coins: 30, label: '30 coins' },
  { coins: 15, label: '15 coins' },
];

export function GameRanking({ unitId, gameType, onClose, accentColor }: Props) {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [unitId, gameType]);

  const loadRanking = async () => {
    setLoading(true);
    // Get current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('game_scores')
      .select('id, score, created_at, customer_id, customers(name)')
      .eq('unit_id', unitId)
      .eq('game_type', gameType)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)
      .order('score', { ascending: gameType === 'memory' }) // memory: lower is better (moves), snake: higher is better
      .limit(20);

    if (data) {
      // For snake: best = highest score. For memory: best = fewest moves
      // Group by customer, keep best score per customer
      const bestByCustomer = new Map<string, RankEntry>();
      for (const row of data as any[]) {
        const custId = row.customer_id;
        const custName = row.customers?.name || 'Jogador';
        const existing = bestByCustomer.get(custId);
        const isBetter = gameType === 'memory'
          ? (!existing || row.score < existing.score)
          : (!existing || row.score > existing.score);
        if (isBetter) {
          bestByCustomer.set(custId, {
            id: row.id,
            score: row.score,
            customer_name: custName,
            created_at: row.created_at,
          });
        }
      }

      const sorted = Array.from(bestByCustomer.values()).sort((a, b) =>
        gameType === 'memory' ? a.score - b.score : b.score - a.score
      );
      setEntries(sorted.slice(0, 10));
    }
    setLoading(false);
  };

  const getPositionIcon = (pos: number) => {
    if (pos === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (pos === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (pos === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white/30">{pos + 1}</span>;
  };

  const accentColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-300' },
  };
  const colors = accentColors[accentColor] || accentColors.emerald;

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm z-50 p-4">
      <div className="w-full max-w-sm bg-[hsl(150,10%,8%)] rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${colors.text}`} />
            <h2 className="text-sm font-bold text-white">Ranking de {monthName}</h2>
          </div>
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded-lg bg-white/5">
            Fechar
          </button>
        </div>

        {/* Prizes info */}
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 border-b border-white/5">
          {PRIZES.map((p, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px]">
              {getPositionIcon(i)}
              <span className="text-yellow-400/80 font-bold">🪙 {p.coins}</span>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Trophy className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30 font-medium">Nenhum jogador ainda</p>
              <p className="text-xs text-white/15 mt-1">Faça login e jogue para entrar no ranking!</p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                <div className="shrink-0">{getPositionIcon(i)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${i === 0 ? 'text-yellow-400' : 'text-white/80'}`}>
                    {entry.customer_name}
                  </p>
                </div>
                <div className={`text-sm font-black tabular-nums ${i < 3 ? colors.text : 'text-white/40'}`}>
                  {gameType === 'memory' ? `${entry.score} jogadas` : `${entry.score} pts`}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/20">
            🔒 Faça login para participar do ranking e ganhar Garden Coins
          </p>
        </div>
      </div>
    </div>
  );
}
