import { useState } from 'react';
import { Plus, MoreVertical, Pencil, Trash2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        <h2 className="text-lg font-bold text-foreground">Opcionais</h2>
        <Button size="sm" onClick={onNew}>
          <Plus className="w-4 h-4 mr-1" /> Criar Novo
        </Button>
      </div>

      {optionGroups.length === 0 ? (
        <div className="empty-state py-12">
          <p className="empty-state-title">Nenhum grupo de opcionais</p>
          <p className="empty-state-text">Crie grupos como "Adicional de Molhos" ou "Acompanhamentos"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {optionGroups.map(og => {
            const avail = og.availability as any;
            return (
              <div key={og.id} className="list-command">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{og.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {avail?.tablet && <Badge variant="secondary" className="text-[8px] px-1 py-0">Mesa</Badge>}
                      {avail?.delivery && <Badge variant="secondary" className="text-[8px] px-1 py-0">Delivery</Badge>}
                      <span className="text-[10px] text-muted-foreground">
                        Min: {og.min_selections} • Max: {og.max_selections}
                        {og.allow_repeat ? ' • Repetir' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onLinkProducts(og)}
                      className="text-xs text-primary hover:underline px-2 py-1"
                    >
                      {(og.linked_product_count || 0) > 0
                        ? `Em ${og.linked_product_count} produto${og.linked_product_count! > 1 ? 's' : ''}`
                        : 'Aplicar em produto'}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-secondary/60">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(og)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onLinkProducts(og)}>
                          <Link2 className="w-3.5 h-3.5 mr-2" /> Vincular produtos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(og.id)} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Options list */}
                {og.options && og.options.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {og.options.map(opt => (
                      <div key={opt.id} className="flex items-center justify-between px-2 py-1 bg-secondary/30 rounded-lg text-xs">
                        <span className="text-foreground">{opt.name}</span>
                        <div className="flex items-center gap-2">
                          {opt.codigo_pdv && <span className="text-muted-foreground">PDV: {opt.codigo_pdv}</span>}
                          <span className="font-medium text-primary">{formatPrice(opt.price)}</span>
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
