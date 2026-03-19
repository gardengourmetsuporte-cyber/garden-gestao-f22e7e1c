import { QRCodeSVG } from 'qrcode.react';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

interface SolutionLinkCardProps {
  icon: string;
  label: string;
  fullUrl: string;
  path: string;
  onQrOpen: () => void;
}

export function SolutionLinkCard({ icon, label, fullUrl, path, onQrOpen }: SolutionLinkCardProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success(`Link "${label}" copiado!`);
  };

  return (
    <div className="rounded-xl bg-secondary/30 border border-border/20 p-2.5 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <AppIcon name={icon} size={15} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground truncate">{label}</p>
        <p className="text-[9px] text-muted-foreground truncate">{path}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onQrOpen}
          className="w-7 h-7 rounded-lg bg-background/60 hover:bg-background flex items-center justify-center transition-colors"
        >
          <AppIcon name="QrCode" size={12} className="text-muted-foreground" />
        </button>
        <button
          onClick={copyLink}
          className="w-7 h-7 rounded-lg bg-background/60 hover:bg-background flex items-center justify-center transition-colors"
        >
          <AppIcon name="Copy" size={12} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => window.open(fullUrl, '_blank')}
          className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
        >
          <AppIcon name="ExternalLink" size={12} className="text-primary" />
        </button>
      </div>
    </div>
  );
}
