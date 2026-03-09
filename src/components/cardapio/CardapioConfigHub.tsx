import { lazy, Suspense } from 'react';
import { useUnit } from '@/contexts/UnitContext';
import { QRCodeSVG } from 'qrcode.react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const CardapioSettings = lazy(() =>
  import('@/components/settings/CardapioSettings').then(m => ({ default: m.CardapioSettings }))
);

const SECTIONS = [
  { id: 'delivery', icon: 'Truck', label: 'Solução Delivery', description: 'Sobre, delivery & retirada, áreas, pagamento, horários', settingsTab: 'config' as const },
  { id: 'tablet', icon: 'Tablet', label: 'Solução Tablet', description: 'Integração PDV, mesas, QR codes e chave Pix', settingsTab: 'pdv' as const },
  { id: 'qrcode', icon: 'QrCode', label: 'QR Code Balcão', description: 'Link externo para pedidos via celular do cliente', settingsTab: null },
  { id: 'gamificacao', icon: 'Dices', label: 'Gamificação', description: 'Roleta de prêmios e probabilidades', settingsTab: 'roleta' as const },
  { id: 'rodizio', icon: 'all_inclusive', label: 'Rodízio', description: 'Preço fixo, regras e categorias', settingsTab: 'rodizio' as const },
];

export function CardapioConfigHub() {
  const { activeUnit } = useUnit();
  const baseUrl = window.location.origin;
  const qrCodeUrl = activeUnit ? `${baseUrl}/m/${activeUnit.id}?source=qrcode` : '';

  return (
    <div className="px-4 py-3 lg:px-6 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <AppIcon name="Settings" size={18} className="text-primary" />
        <h1 className="text-base font-bold text-foreground">Configurações</h1>
      </div>

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
              {section.id === 'qrcode' ? (
                <QRCodeBalcaoSection url={qrCodeUrl} />
              ) : section.id === 'tablet' ? (
                <Suspense fallback={<SectionSkeleton />}>
                  <CardapioSettings initialTab="pdv" embedded />
                </Suspense>
              ) : section.id === 'delivery' ? (
                <Suspense fallback={<SectionSkeleton />}>
                  <CardapioSettings initialTab="config" embedded />
                </Suspense>
              ) : section.id === 'gamificacao' ? (
                <Suspense fallback={<SectionSkeleton />}>
                  <CardapioSettings initialTab="roleta" embedded />
                </Suspense>
              ) : section.id === 'rodizio' ? (
                <Suspense fallback={<SectionSkeleton />}>
                  <CardapioSettings initialTab="rodizio" embedded />
                </Suspense>
              ) : (
                <Suspense fallback={<SectionSkeleton />}>
                  <CardapioSettings initialTab={section.settingsTab} embedded />
                </Suspense>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
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
          <p className="text-sm font-semibold text-foreground">QR Code Balcão</p>
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
            <a
              href={url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
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
