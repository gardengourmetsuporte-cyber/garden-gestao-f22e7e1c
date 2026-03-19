import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Bot',
    description: 'Atendimento automático via WhatsApp com IA',
    icon: 'MessageCircle',
    color: '#25D366',
    configPath: '/whatsapp/settings',
    status: 'available' as const,
  },
  {
    id: 'n8n',
    name: 'n8n Workflows',
    description: 'Automações customizadas via n8n (MCP)',
    icon: 'Workflow',
    color: '#FF6D5A',
    configPath: null,
    status: 'coming_soon' as const,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Conecte com milhares de apps via Zapier',
    icon: 'Zap',
    color: '#FF4A00',
    configPath: null,
    status: 'coming_soon' as const,
  },
  {
    id: 'ifood',
    name: 'iFood',
    description: 'Integração com pedidos do iFood',
    icon: 'Truck',
    color: '#EA1D2C',
    configPath: '/delivery-hub',
    status: 'available' as const,
  },
  {
    id: 'colibri',
    name: 'Colibri PDV',
    description: 'Envio automático de pedidos para o PDV Colibri',
    icon: 'Zap',
    color: '#8B5CF6',
    configPath: '/cardapio?section=config&configTab=pdv',
    status: 'available' as const,
  },
];

export function AgentIntegrations() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Integrações disponíveis para expandir as capacidades do agente.
      </p>

      <div className="space-y-3">
        {INTEGRATIONS.map(integration => (
          <div key={integration.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${integration.color}, ${integration.color}cc)`,
                boxShadow: `0 4px 12px -2px ${integration.color}40`,
              }}
            >
              <AppIcon name={integration.icon as any} className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{integration.name}</p>
                {integration.status === 'coming_soon' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Em breve</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{integration.description}</p>
            </div>
            {integration.configPath && (
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate(integration.configPath!)}>
                Configurar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
