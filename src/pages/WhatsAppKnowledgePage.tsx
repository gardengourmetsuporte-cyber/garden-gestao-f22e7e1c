import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { WhatsAppKnowledge } from '@/components/whatsapp/WhatsAppKnowledge';

export default function WhatsAppKnowledgePage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="min-h-screen pb-36 lg:pb-12">
        <WhatsAppKnowledge />
      </div>
    </AppLayout>
  );
}
