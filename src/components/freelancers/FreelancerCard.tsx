import { Phone, MessageCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Freelancer } from '@/hooks/useFreelancers';
import { SECTORS } from '@/hooks/useFreelancers';

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

interface Props {
  freelancer: Freelancer;
  onEdit: (f: Freelancer) => void;
  onDelete: (id: string) => void;
}

export function FreelancerCard({ freelancer, onEdit, onDelete }: Props) {
  const sector = SECTORS.find(s => s.value === freelancer.sector);
  const waLink = `https://wa.me/${formatPhone(freelancer.phone)}`;

  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">{freelancer.name}</span>
          {!freelancer.is_active && (
            <Badge variant="outline" className="text-xs opacity-60">Inativo</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className="text-xs text-white"
            style={{ backgroundColor: sector?.color || '#64748b' }}
          >
            {sector?.label || freelancer.sector}
          </Badge>
          <span className="text-xs text-muted-foreground">{freelancer.phone}</span>
        </div>
        {freelancer.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{freelancer.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500" asChild>
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9" asChild>
          <a href={`tel:${freelancer.phone}`}>
            <Phone className="h-4 w-4" />
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(freelancer)}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(freelancer.id)}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
