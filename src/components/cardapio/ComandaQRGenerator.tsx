import { useState, useRef } from 'react';
import { useUnit } from '@/contexts/UnitContext';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

export function ComandaQRGenerator() {
  const { activeUnit } = useUnit();
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(20);
  const printRef = useRef<HTMLDivElement>(null);

  if (!activeUnit) {
    return <p className="text-sm text-muted-foreground">Selecione uma unidade.</p>;
  }

  const comandas = Array.from({ length: Math.min(rangeEnd - rangeStart + 1, 100) }, (_, i) => rangeStart + i);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permita pop-ups para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comandas ${rangeStart}-${rangeEnd}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; }
          .card { border: 2px solid #222; border-radius: 12px; padding: 16px; text-align: center; break-inside: avoid; }
          .card h2 { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
          .card p { font-size: 10px; color: #666; margin-top: 6px; }
          .qr { display: flex; justify-content: center; }
          @media print {
            .grid { gap: 8px; padding: 8px; }
            .card { border-width: 1.5px; padding: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${comandas.map(n => {
            const value = JSON.stringify({ comanda: n, unit_id: activeUnit.id });
            return `
              <div class="card">
                <h2>Comanda #${n}</h2>
                <div class="qr" id="qr-${n}"></div>
                <p>Apresente ao finalizar</p>
              </div>
            `;
          }).join('')}
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"><\/script>
        <script>
          ${comandas.map(n => {
            const value = JSON.stringify({ comanda: n, unit_id: activeUnit.id });
            return `
              (function(){
                var qr = qrcode(0, 'M');
                qr.addData('${value}');
                qr.make();
                document.getElementById('qr-${n}').innerHTML = qr.createSvgTag(4);
              })();
            `;
          }).join('')}
          setTimeout(function(){ window.print(); }, 500);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs text-muted-foreground">
        Gere e imprima QR codes para suas comandas físicas. Cada comanda terá um número e um QR code único que o cliente apresenta ao fazer o pedido.
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">De</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={rangeStart}
            onChange={e => setRangeStart(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="h-10 rounded-xl text-center"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Até</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={rangeEnd}
            onChange={e => setRangeEnd(Math.max(rangeStart, Math.min(100, parseInt(e.target.value) || 1)))}
            className="h-10 rounded-xl text-center"
          />
        </div>
      </div>

      <Button onClick={handlePrint} className="w-full rounded-xl">
        <AppIcon name="Printer" size={16} className="mr-2" />
        Imprimir Comandas ({comandas.length})
      </Button>

      {/* Preview */}
      <div ref={printRef} className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {comandas.slice(0, 9).map(n => {
          const value = JSON.stringify({ comanda: n, unit_id: activeUnit.id });
          return (
            <div key={n} className="rounded-xl border border-border/30 bg-white p-3 flex flex-col items-center gap-1.5">
              <p className="text-xs font-black text-foreground">#{n}</p>
              <QRCodeSVG value={value} size={56} level="M" bgColor="#ffffff" fgColor="#000000" />
            </div>
          );
        })}
        {comandas.length > 9 && (
          <div className="rounded-xl border border-border/30 bg-secondary/30 p-3 flex items-center justify-center col-span-3">
            <p className="text-xs text-muted-foreground">+{comandas.length - 9} comandas na impressão</p>
          </div>
        )}
      </div>
    </div>
  );
}
