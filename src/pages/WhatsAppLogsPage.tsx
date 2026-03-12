import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { WhatsAppLogs } from '@/components/whatsapp/WhatsAppLogs';

export default function WhatsAppLogsPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem-5rem)] lg:h-screen">
        <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-border/20">
          <button onClick={() => navigate('/whatsapp')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors lg:hidden">
            <AppIcon name="ArrowLeft" size={18} className="text-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Logs IA</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <WhatsAppLogs />
        </div>
      </div>
    </AppLayout>
  );
}
