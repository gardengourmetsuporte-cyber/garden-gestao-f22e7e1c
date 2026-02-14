import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { MenuOptionGroup } from '@/hooks/useMenuAdmin';

interface Props {
  optionGroups: MenuOptionGroup[];
  onNew: () => void;
  onEdit: (og: MenuOptionGroup) => void;
  onDelete: (id: string) => void;
  onLinkProducts: (og: MenuOptionGroup) => void;
}

const formatPrice = (v: number) =>
  v === 0 ? 'Grátis' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function OptionGroupList({ optionGroups, onNew, onEdit, onDelete, onLinkProducts }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="icon-glow icon-glow-md icon-glow-warning">
            <AppIcon name="Settings" size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Opcionais</h2>
            <p className="text-[11px] text-muted-foreground">{optionGroups.length} grupo{optionGroups.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button size="sm" onClick={onNew} className="gap-1.5">
          <AppIcon name="Plus" size={14} /> Criar Novo
        </Button>
      </div>

      {optionGroups.length === 0 ? (
        <div className="card-base p-6">
          <div className="empty-state py-8">
            <div className="icon-glow icon-glow-lg icon-glow-muted mx-auto mb-3">
              <AppIcon name="Settings" size={24} />
            </div>
            <p className="empty-state-title">Nenhum grupo de opcionais</p>
            <p className="empty-state-text mb-4">Crie grupos como "Molhos" ou "Acompanhamentos"</p>
            <Button size="sm" onClick={onNew}>
              <AppIcon name="Plus" size={14} className="mr-1.5" /> Criar Grupo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {optionGroups.map(og => {
            const avail = og.availability as any;
            return (
              <div key={og.id} className="card-base p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: 'hsl(var(--neon-amber) / 0.1)',
                        border: '1px solid hsl(var(--neon-amber) / 0.2)',
                      }}
                    >
                      <AppIcon name="Settings" size={18} className="text-warning" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--neon-amber) / 0.4))' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{og.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {avail?.tablet && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                            background: 'hsl(var(--neon-cyan) / 0.1)', color: 'hsl(var(--neon-cyan))',
                          }}>Mesa</span>
                        )}
                        {avail?.delivery && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                            background: 'hsl(var(--neon-green) / 0.1)', color: 'hsl(var(--neon-green))',
                          }}>Delivery</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          Min: {og.min_selections} • Max: {og.max_selections}
                          {og.allow_repeat ? ' • Repetir' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onLinkProducts(og)}
                      className="text-[10px] text-primary font-medium px-2 py-1 rounded-lg transition-all active:scale-[0.97]"
                      style={{ background: 'hsl(var(--primary) / 0.08)' }}
                    >
                      {(og.linked_product_count || 0) > 0
                        ? `${og.linked_product_count} produto${og.linked_product_count! > 1 ? 's' : ''}`
                        : 'Vincular'}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-secondary/60">
                          <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(og)}>
                          <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onLinkProducts(og)}>
                          <AppIcon name="Link" size={14} className="mr-2" /> Vincular produtos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(og.id)} className="text-destructive">
                          <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Options list */}
                {og.options && og.options.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {og.options.map(opt => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: 'hsl(var(--secondary) / 0.4)',
                          border: '1px solid hsl(var(--border) / 0.2)',
                        }}
                      >
                        <span className="text-foreground font-medium">{opt.name}</span>
                        <div className="flex items-center gap-2.5">
                          {opt.codigo_pdv && <span className="text-muted-foreground">PDV: {opt.codigo_pdv}</span>}
                          <span className="font-semibold" style={{ color: opt.price === 0 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--neon-green))' }}>
                            {formatPrice(opt.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
