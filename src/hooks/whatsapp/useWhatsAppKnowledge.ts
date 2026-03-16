import { useUnifiedKnowledge } from '@/hooks/useCopilotConfig';

/** WhatsApp knowledge now shares the same unified knowledge base as Copilot */
export function useWhatsAppKnowledge() {
  return useUnifiedKnowledge();
}
