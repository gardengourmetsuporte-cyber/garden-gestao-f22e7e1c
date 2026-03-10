import { useState, lazy, Suspense } from 'react';
import { useUnit } from '@/contexts/UnitContext';
import { KDSStationsManager } from '@/components/menu-admin/KDSStationsManager';
import { QRCodeSVG } from 'qrcode.react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const CardapioSettings = lazy(() =>
  import('@/components/settings/CardapioSettings').then(m => ({ default: m.CardapioSettings }))
);

const LINKS_DATA = [
  { key: 'public', icon: 'Globe', label: 'Cardápio Digital', buildPath: (unitId: string) => `/m/${unitId}` },
  { key: 'qrcode', icon: 'QrCode', label: 'QR Code Balcão', buildPath: (unitId: string) => `/m/${unitId}?source=qrcode` },
  { key: 'tablet', icon: 'Tablet', label: 'Cardápio Tablet', buildPath: (unitId: string) => `/tablet/${unitId}/menu?mesa=1` },
  { key: 'kds', icon: 'ChefHat', label: 'KDS - Cozinha', buildPath: (unitId: string) => `/kds/${unitId}` },
] as const;

const SECTIONS = [
  { id: 'kds-stations', icon: 'ChefHat', label: 'Pistas da Cozinha (KDS)', description: 'Setores configuráveis para agrupar ingredientes no KDS', settingsTab: null },
  { id: 'delivery', icon: 'Truck', label: 'Solução Delivery', description: 'Sobre, delivery & retirada, áreas, pagamento, horários', settingsTab: 'config' as const },
  { id: 'tablet', icon: 'Tablet', label: 'Solução Tablet', description: 'Integração PDV, mesas, QR codes e chave Pix', settingsTab: 'pdv' as const },
  { id: 'qrcode', icon: 'QrCode', label: 'Solução QR Code', description: 'Link externo para pedidos via celular do cliente', settingsTab: null },
  { id: 'rodizio', icon: 'all_inclusive', label: 'Rodízio', description: 'Preço fixo, regras e categorias', settingsTab: 'rodizio' as const },
];

export function CardapioConfigHub() {
  const { activeUnit } = useUnit();
  const baseUrl = window.location.origin;
  const [qrOpen, setQrOpen] = useState<string | null>(null);

  const copyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`Link "${label}" copiado!`);
  };

  return (
    <div className="px-4 py-3 lg:px-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <AppIcon name="Settings" size={18} className="text-primary" />
        <h1 className="text-base font-bold text-foreground">Configurações</h1>
      </div>

      {/* Links & Acessos */}
      {activeUnit && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Links & Acessos</p>
          <div className="space-y-1.5">
            {LINKS_DATA.map(link => {
              const url = link.buildUrl(baseUrl, activeUnit.id);
              return (
                <div key={link.key} className="rounded-2xl bg-card border border-border/30 p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <AppIcon name={link.icon} size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{link.label}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{url.replace(/^https?:\/\//, '')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setQrOpen(link.key)}
                      className="w-7 h-7 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                    >
                      <AppIcon name="QrCode" size={12} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => copyLink(url, link.label)}
                      className="w-7 h-7 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                    >
                      <AppIcon name="Copy" size={12} className="text-muted-foreground" />
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                    >
                      <AppIcon name="ExternalLink" size={12} className="text-primary" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Config Sections */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Configurações</p>
        <Accordion type="single" collapsible className="space-y-2">
          {SECTIONS.map(section => (
            <AccordionItem key={section.id} value={section.id} className="border-0 rounded-2xl bg-card border border-border/30 overflow-hidden">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-secondary/20 [&[data-state=open]]:bg-secondary/10">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <AppIcon name={section.icon} size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{section.label}</p>
                    <p className="text-[10px] text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                {section.id === 'kds-stations' ? (
                  <KDSStationsManager />
                ) : section.id === 'qrcode' ? (
                  <QRCodeBalcaoSection url={activeUnit ? `${baseUrl}/m/${activeUnit.id}?source=qrcode` : ''} />
                ) : (
                  <Suspense fallback={<SectionSkeleton />}>
                    <CardapioSettings
                      initialTab={section.id === 'delivery' ? 'config' : section.id === 'tablet' ? 'pdv' : section.id === 'gamificacao' ? 'roleta' : 'rodizio'}
                      embedded
                    />
                  </Suspense>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* QR Code Modal */}
      {qrOpen && activeUnit && (() => {
        const link = LINKS_DATA.find(l => l.key === qrOpen);
        if (!link) return null;
        const url = link.buildUrl(baseUrl, activeUnit.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setQrOpen(null)}>
            <div
              className="bg-card rounded-3xl p-8 shadow-2xl border border-border/30 flex flex-col items-center gap-5 max-w-xs w-full mx-4 animate-in zoom-in-95 fade-in duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">{link.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">Escaneie para acessar</p>
              </div>
              <div className="bg-white rounded-2xl p-5">
                <QRCodeSVG value={url} size={200} level="H" bgColor="#ffffff" fgColor="#000000" />
              </div>
              <button
                onClick={() => copyLink(url, link.label)}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <AppIcon name="Copy" size={16} /> Copiar link
              </button>
              <button onClick={() => setQrOpen(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Fechar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function QRCodeBalcaoSection({ url }: { url: string }) {
  if (!url) return <p className="text-sm text-muted-foreground">Selecione uma unidade para gerar o QR Code.</p>;

  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs text-muted-foreground">
        O cliente escaneia este QR Code no balcão, acessa o cardápio pelo celular e faz o pedido. Pedidos entram com origem <span className="font-semibold text-foreground">QR Code</span>.
      </p>
      <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
        <QRCodeSVG value={url} size={96} bgColor="transparent" fgColor="currentColor" className="text-foreground shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">Solução QR Code</p>
          <p className="text-[10px] text-muted-foreground truncate">{url.replace(/^https?:\/\//, '')}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success('Link copiado!');
              }}
            >
              <AppIcon name="Copy" size={12} className="mr-1" /> Copiar
            </Button>
            <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              <AppIcon name="ExternalLink" size={12} /> Abrir
            </a>
          </div>
        </div>
      </div>
    </div>
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
