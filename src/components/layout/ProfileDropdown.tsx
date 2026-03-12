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
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { InviteShareDialog } from './InviteShareDialog';
import { useIsMobile } from '@/hooks/use-mobile';

export function ProfileDropdown() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    setSheetOpen(false);
    await signOut();
    navigate('/auth');
  };

  const handleNavigate = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  const handleInvite = () => {
    setSheetOpen(false);
    setTimeout(() => setInviteOpen(true), 150);
  };

  const triggerButton = (
    <button
      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 active:scale-95 transition-all"
      onClick={isMobile ? () => setSheetOpen(true) : undefined}
    >
      <Avatar className="w-7 h-7 ring-1 ring-border/40">
        {profile?.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Avatar'} className="object-cover" />
        ) : null}
        <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  );

  const menuItems = (
    <>
      <button
        onClick={() => handleNavigate('/profile/me')}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm text-foreground active:bg-muted/50 transition-colors rounded-lg"
      >
        <AppIcon name="User" size={18} className="text-muted-foreground" />
        Meu Perfil
      </button>
      <button
        onClick={() => handleNavigate('/settings')}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm text-foreground active:bg-muted/50 transition-colors rounded-lg"
      >
        <AppIcon name="Settings" size={18} className="text-muted-foreground" />
        Configurações
      </button>
      <button
        onClick={handleInvite}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm text-foreground active:bg-muted/50 transition-colors rounded-lg"
      >
        <AppIcon name="UserPlus" size={18} className="text-muted-foreground" />
        Convidar Equipe
      </button>
      <div className="h-px bg-border my-1 mx-4" />
      <button
        onClick={handleSignOut}
        className="flex items-center w-full gap-3 px-4 py-3 text-sm text-destructive active:bg-muted/50 transition-colors rounded-lg"
      >
        <AppIcon name="LogOut" size={18} />
        Sair
      </button>
    </>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="p-0">
            <div className="px-4 pt-2 pb-1">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-1 ring-border/40">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Avatar'} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-semibold truncate">{profile?.full_name || 'Usuário'}</SheetTitle>
                  <p className="text-xs text-muted-foreground truncate">Minha conta</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-border mx-4 my-1" />
            <div className="pb-4">
              {menuItems}
            </div>
          </SheetContent>
        </Sheet>
        <InviteShareDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {triggerButton}
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
