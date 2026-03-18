import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Send } from 'lucide-react';
import { SECTORS, type Freelancer } from '@/hooks/useFreelancers';
import { toast } from 'sonner';

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freelancers: Freelancer[];
}

const DEFAULT_MSG = 'Olá {nome}! Temos uma vaga disponível para {setor}.\n\n💰 Valor: R${valor}\n🕐 Horário: {horario}\n\nTem interesse?';

export function FreelancerBroadcastSheet({ open, onOpenChange, freelancers }: Props) {
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [valor, setValor] = useState('');
  const [horario, setHorario] = useState('');

  const filtered = useMemo(() => {
    const active = freelancers.filter(f => f.is_active);
    return sectorFilter ? active.filter(f => f.sector === sectorFilter) : active;
  }, [freelancers, sectorFilter]);

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(f => f.id)));
    }
  };

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const send = () => {
    const targets = filtered.filter(f => selected.has(f.id));
    if (!targets.length) { toast.error('Selecione ao menos um freelancer'); return; }

    const sectorMap = Object.fromEntries(SECTORS.map(s => [s.value, s.label]));

    targets.forEach((f, i) => {
      const text = message
        .replace(/\{nome\}/gi, f.name.split(' ')[0])
        .replace(/\{setor\}/gi, sectorMap[f.sector] || f.sector)
        .replace(/\{valor\}/gi, valor || '___')
        .replace(/\{horario\}/gi, horario || '___');

      setTimeout(() => {
        window.open(`https://wa.me/${formatPhone(f.phone)}?text=${encodeURIComponent(text)}`, '_blank');
      }, i * 800);
    });

    toast.success(`Abrindo ${targets.length} conversa(s) no WhatsApp`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Enviar Mensagem em Massa</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Sector filter */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={sectorFilter === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSectorFilter(null)}
            >
              Todos
            </Badge>
            {SECTORS.map(s => (
              <Badge
                key={s.value}
                variant={sectorFilter === s.value ? 'default' : 'outline'}
                className="cursor-pointer"
                style={sectorFilter === s.value ? { backgroundColor: s.color } : {}}
                onClick={() => setSectorFilter(s.value)}
              >
                {s.label}
              </Badge>
            ))}
          </div>

          {/* Variables */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valor do dia (R$)</Label>
              <input
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                placeholder="150"
                value={valor}
                onChange={e => setValor(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div>
              <Label className="text-xs">Horário</Label>
              <input
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                placeholder="18h às 23h"
                value={horario}
                onChange={e => setHorario(e.target.value)}
              />
            </div>
          </div>

          {/* Message template */}
          <div>
            <Label className="text-xs">Mensagem (use {'{nome}'}, {'{setor}'}, {'{valor}'}, {'{horario}'})</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              className="text-sm"
            />
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">{filtered.length} freelancer(s)</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
                {selected.size === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filtered.map(f => {
                const sector = SECTORS.find(s => s.value === f.sector);
                return (
                  <label key={f.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggle(f.id)} />
                    <span className="text-sm flex-1 truncate">{f.name}</span>
                    <Badge className="text-[10px] text-white" style={{ backgroundColor: sector?.color }}>
                      {sector?.label}
                    </Badge>
                  </label>
                );
              })}
            </div>
          </div>

          <Button onClick={send} className="w-full gap-2" disabled={selected.size === 0}>
            <Send className="h-4 w-4" />
            Enviar para {selected.size} pessoa(s)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
