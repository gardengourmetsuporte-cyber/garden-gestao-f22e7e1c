import { useState, lazy, Suspense } from 'react';
import { useUnit } from '@/contexts/UnitContext';
import { KDSStationsManager } from '@/components/menu-admin/KDSStationsManager';
import { SolutionLinkCard } from './SolutionLinkCard';

import { QRCodeSVG } from 'qrcode.react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getPublicAppUrl } from '@/lib/publicAppUrl';

const CardapioSettings = lazy(() =>
  import('@/components/settings/CardapioSettings').then(m => ({ default: m.CardapioSettings }))
);

type SectionLink = {
  icon: string;
  label: string;
  buildPath: (unitId: string) => string;
};

const SECTIONS = [
  {
    id: 'kds-stations',
    icon: 'ChefHat',
    label: 'Solução KDS',
    description: 'Pistas e setores configuráveis para a cozinha',
    settingsTab: null,
    links: [{ icon: 'ChefHat', label: 'KDS - Cozinha', buildPath: (id: string) => `/kds/${id}` }] as SectionLink[],
  },
  {
    id: 'delivery',
    icon: 'Truck',
    label: 'Solução Delivery',
    description: 'Sobre, delivery & retirada, áreas, pagamento, horários',
    settingsTab: 'config' as const,
    links: [{ icon: 'Globe', label: 'Cardápio Digital', buildPath: (id: string) => `/m/${id}` }] as SectionLink[],
  },
  {
    id: 'tablet',
    icon: 'Tablet',
    label: 'Solução Tablet',
    description: 'Mesas, comandas, QR codes e chave Pix',
    settingsTab: 'mesas' as const,
    links: [{ icon: 'Tablet', label: 'Cardápio Tablet', buildPath: (id: string) => `/tablet/${id}` }] as SectionLink[],
  },
  {
    id: 'qrcode',
    icon: 'ScanLine',
    label: 'Solução QR Code',
    description: 'Link externo para pedidos via celular do cliente',
    settingsTab: null,
    links: [{ icon: 'QrCode', label: 'QR Code Balcão', buildPath: (id: string) => `/m/${id}?source=qrcode` }] as SectionLink[],
  },
  {
    id: 'rodizio',
    icon: 'all_inclusive',
    label: 'Rodízio',
    description: 'Preço fixo, regras e categorias',
    settingsTab: 'rodizio' as const,
    links: [] as SectionLink[],
  },
];

export function CardapioConfigHub() {
  const { activeUnit } = useUnit();
  const baseUrl = getPublicAppUrl();
  const [qrOpen, setQrOpen] = useState<{ label: string; url: string } | null>(null);

  return (
    <div className="px-4 py-3 lg:px-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <AppIcon name="Settings" size={18} className="text-primary" />
        <h1 className="text-base font-bold text-foreground">Configurações</h1>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {SECTIONS.map(section => (
          <AccordionItem key={section.id} value={section.id} className="border-0 rounded-2xl bg-card border border-border/30 overflow-hidden">
            <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-secondary/20 [&[data-state=open]]:bg-secondary/10">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
                  <AppIcon name={section.icon} size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{section.label}</p>
                  <p className="text-[10px] text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4">
                {/* Acesso Rápido */}
                {activeUnit && section.links.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Acesso Rápido</p>
                    {section.links.map(link => {
                      const path = link.buildPath(activeUnit.id);
                      const fullUrl = `${baseUrl}${path}`;
                      return (
                        <SolutionLinkCard
                          key={path}
                          icon={link.icon}
                          label={link.label}
                          fullUrl={fullUrl}
                          path={path}
                          onQrOpen={() => setQrOpen({ label: link.label, url: fullUrl })}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Configurações */}
                {(section.settingsTab || section.id === 'kds-stations' || section.id === 'qrcode') && (
                  <div className="space-y-1.5">
                    {section.links.length > 0 && (
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Configurações</p>
                    )}
                    {section.id === 'kds-stations' ? (
                      <KDSStationsManager />
                    ) : section.id === 'qrcode' ? (
                      <QRCodeBalcaoInfo url={activeUnit ? `${baseUrl}/m/${activeUnit.id}?source=qrcode` : ''} />
                    ) : (
                      <Suspense fallback={<SectionSkeleton />}>
                        <CardapioSettings
                          initialTab={section.id === 'delivery' ? 'config' : section.id === 'tablet' ? 'mesas' : 'rodizio'}
                          embedded
                        />
                      </Suspense>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* QR Code Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setQrOpen(null)}>
          <div
            className="bg-card rounded-3xl p-8 shadow-2xl border border-border/30 flex flex-col items-center gap-5 max-w-xs w-full mx-4 animate-in zoom-in-95 fade-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">{qrOpen.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">Escaneie para acessar</p>
            </div>
            <div className="bg-white rounded-2xl p-5">
              <QRCodeSVG value={qrOpen.url} size={200} level="H" bgColor="#ffffff" fgColor="#000000" />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrOpen.url);
                toast.success(`Link "${qrOpen.label}" copiado!`);
              }}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <AppIcon name="Copy" size={16} /> Copiar link
            </button>
            <button onClick={() => setQrOpen(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QRCodeBalcaoInfo({ url }: { url: string }) {
  if (!url) return <p className="text-sm text-muted-foreground">Selecione uma unidade para gerar o QR Code.</p>;
  return (
    <p className="text-xs text-muted-foreground">
      O cliente escaneia o QR Code no balcão, acessa o cardápio pelo celular e faz o pedido. Pedidos entram com origem <span className="font-semibold text-foreground">QR Code</span>.
    </p>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3 pt-2">
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
