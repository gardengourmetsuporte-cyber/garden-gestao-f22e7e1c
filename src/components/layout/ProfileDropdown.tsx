import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InviteShareDialog } from './InviteShareDialog';

export function ProfileDropdown() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="w-7 h-7 ring-1 ring-border/40">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Avatar'} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.full_name ? 'Minha conta' : ''}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile/me')}>
            <AppIcon name="User" size={16} className="mr-2 text-muted-foreground" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <AppIcon name="Settings" size={16} className="mr-2 text-muted-foreground" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setInviteOpen(true)}>
            <AppIcon name="UserPlus" size={16} className="mr-2 text-muted-foreground" />
            Convidar Equipe
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <AppIcon name="LogOut" size={16} className="mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteShareDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
