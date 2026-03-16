import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { useCopilotConfig } from '@/hooks/useCopilotConfig';

const ROLES = [
  { key: 'owner', label: 'Dono', description: 'Proprietários da unidade', icon: 'Crown' },
  { key: 'admin', label: 'Gerente', description: 'Administradores e gerentes', icon: 'Shield' },
  { key: 'member', label: 'Funcionário', description: 'Colaboradores operacionais', icon: 'User' },
];

export function AgentPermissions() {
  const { config, isLoading, upsertConfig } = useCopilotConfig();
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['owner', 'admin', 'member']);
  const [restrictDestructive, setRestrictDestructive] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setAllowedRoles((config as any).allowed_roles || ['owner', 'admin', 'member']);
      setRestrictDestructive((config as any).restrict_destructive_tools || false);
    }
  }, [config]);

  const toggleRole = (key: string) => {
    if (key === 'owner') return; // Owner always has access
    setAllowedRoles(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setDirty(true);
  };

  const handleSave = () => {
    upsertConfig.mutate({
      allowed_roles: allowedRoles,
      restrict_destructive_tools: restrictDestructive,
    } as any, { onSuccess: () => setDirty(false) });
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Quem pode usar o Copiloto?</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Defina quais papéis da equipe podem interagir com o agente IA.
        </p>

        <div className="space-y-2">
          {ROLES.map(role => (
            <div key={role.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name={role.icon as any} className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{role.label}</p>
                <p className="text-[11px] text-muted-foreground">{role.description}</p>
              </div>
              <Switch
                checked={allowedRoles.includes(role.key)}
                onCheckedChange={() => toggleRole(role.key)}
                disabled={role.key === 'owner'}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Restrições de Segurança</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Controle ações sensíveis que o agente pode executar.
        </p>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AppIcon name="ShieldAlert" className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Restringir ferramentas destrutivas</p>
            <p className="text-[11px] text-muted-foreground">
              Criar transação, excluir tarefa, movimentar estoque — apenas para donos e gerentes
            </p>
          </div>
          <Switch
            checked={restrictDestructive}
            onCheckedChange={(v) => { setRestrictDestructive(v); setDirty(true); }}
          />
        </div>
      </div>

      {dirty && (
        <Button onClick={handleSave} disabled={upsertConfig.isPending} className="w-full gap-2">
          <AppIcon name="Save" className="w-4 h-4" />
          {upsertConfig.isPending ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      )}
    </div>
  );
}
