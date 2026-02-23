import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';

interface Contact {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface NewConversationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDirect: (userId: string) => Promise<string | null>;
  onCreateGroup: (name: string, memberIds: string[], type: 'group' | 'announcement') => Promise<string | null>;
}

type Mode = 'select' | 'direct' | 'group' | 'announcement';

export function NewConversationSheet({ open, onOpenChange, onCreateDirect, onCreateGroup }: NewConversationSheetProps) {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const [mode, setMode] = useState<Mode>('select');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('select');
      setSearch('');
      setSelectedIds([]);
      setGroupName('');
      return;
    }
    fetchContacts();
  }, [open, activeUnitId]);

  const fetchContacts = async () => {
    if (!activeUnitId || !user) return;

    const { data: unitUsers } = await supabase
      .from('user_units')
      .select('user_id')
      .eq('unit_id', activeUnitId);

    if (!unitUsers) return;

    const userIds = unitUsers.map(u => u.user_id).filter(id => id !== user.id);

    if (userIds.length === 0) {
      setContacts([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds)
      .order('full_name');

    setContacts(profiles || []);
  };

  const filtered = contacts.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDirectSelect = async (userId: string) => {
    setIsLoading(true);
    const convId = await onCreateDirect(userId);
    setIsLoading(false);
    if (convId) onOpenChange(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setIsLoading(true);
    const type = mode === 'announcement' ? 'announcement' : 'group';
    const convId = await onCreateGroup(groupName.trim(), selectedIds, type);
    setIsLoading(false);
    if (convId) onOpenChange(false);
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-background border-border/20">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {mode === 'select' ? 'Nova Conversa' :
             mode === 'direct' ? 'Conversa Direta' :
             mode === 'group' ? 'Novo Grupo' : 'Novo Canal de Comunicados'}
          </SheetTitle>
        </SheetHeader>

        {mode === 'select' ? (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => setMode('direct')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-all"
              style={{ border: '1px solid hsl(var(--border) / 0.2)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
                <AppIcon name="MessageCircle" size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Conversa Direta</p>
                <p className="text-xs text-muted-foreground">Mensagem 1:1 com um colega</p>
              </div>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setMode('group')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-all"
                  style={{ border: '1px solid hsl(var(--border) / 0.2)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
                    <AppIcon name="Users" size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Grupo</p>
                    <p className="text-xs text-muted-foreground">Chat em grupo com a equipe</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('announcement')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-all"
                  style={{ border: '1px solid hsl(var(--border) / 0.2)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(45 100% 50% / 0.1)' }}>
                    <AppIcon name="Megaphone" size={20} className="text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Canal de Comunicados</p>
                    <p className="text-xs text-muted-foreground">Avisos para toda a equipe</p>
                  </div>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col h-[calc(100%-80px)]">
            {(mode === 'group' || mode === 'announcement') && (
              <div className="mb-3">
                <Input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder={mode === 'announcement' ? 'Nome do canal...' : 'Nome do grupo...'}
                  className="h-10 rounded-xl bg-secondary/50 border-border/20"
                />
              </div>
            )}

            <div className="relative mb-3">
              <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="pl-9 h-9 rounded-xl bg-secondary/50 border-border/20 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {filtered.map(contact => {
                const initials = contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isSelected = selectedIds.includes(contact.user_id);

                return (
                  <button
                    key={contact.user_id}
                    onClick={() => mode === 'direct' ? handleDirectSelect(contact.user_id) : toggleSelect(contact.user_id)}
                    disabled={isLoading}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      isSelected ? 'bg-primary/10' : 'hover:bg-secondary/50'
                    )}
                  >
                    {mode !== 'direct' && (
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                    )}
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{contact.full_name}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground/50 text-sm py-8">Nenhum contato encontrado</p>
              )}
            </div>

            {(mode === 'group' || mode === 'announcement') && (
              <div className="shrink-0 pt-3">
                <Button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedIds.length === 0 || isLoading}
                  className="w-full rounded-xl"
                >
                  {isLoading ? 'Criando...' : `Criar ${mode === 'announcement' ? 'Canal' : 'Grupo'} (${selectedIds.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
