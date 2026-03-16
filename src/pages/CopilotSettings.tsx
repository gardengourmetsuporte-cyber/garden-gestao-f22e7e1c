import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { AgentPromptEditor } from '@/components/copilot/AgentPromptEditor';
import { CopilotKnowledgeBase } from '@/components/copilot/CopilotKnowledgeBase';
import { AgentToolsManager } from '@/components/copilot/AgentToolsManager';
import { AgentPermissions } from '@/components/copilot/AgentPermissions';
import { AgentIntegrations } from '@/components/copilot/AgentIntegrations';
import { AgentPreferences } from '@/components/copilot/AgentPreferences';

const TABS = [
  { key: 'personality', label: 'Personalidade', icon: <AppIcon name="Sparkles" className="w-3.5 h-3.5" />, iconGradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
  { key: 'knowledge', label: 'RAG', icon: <AppIcon name="BookOpen" className="w-3.5 h-3.5" />, iconGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { key: 'tools', label: 'Tools', icon: <AppIcon name="Wrench" className="w-3.5 h-3.5" />, iconGradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { key: 'permissions', label: 'Permissões', icon: <AppIcon name="Shield" className="w-3.5 h-3.5" />, iconGradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  { key: 'integrations', label: 'MCPs', icon: <AppIcon name="Plug" className="w-3.5 h-3.5" />, iconGradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { key: 'preferences', label: 'Preferências', icon: <AppIcon name="Settings" className="w-3.5 h-3.5" />, iconGradient: 'linear-gradient(135deg, #64748b, #475569)' },
];

export default function CopilotSettings() {
  const [activeTab, setActiveTab] = useState('personality');

  return (
    <AppLayout>
      <div className="min-h-screen pb-36 lg:pb-12">
        <div className="px-4 py-4 max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-primary to-primary/70">
              <AppIcon name="Bot" className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Gerenciar Agente IA</h1>
              <p className="text-xs text-muted-foreground">Configure comportamento, conhecimento, permissões e ferramentas</p>
            </div>
          </div>

          {/* Tabs */}
          <AnimatedTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="pt-2">
            {activeTab === 'personality' && <AgentPromptEditor />}
            {activeTab === 'knowledge' && <CopilotKnowledgeBase />}
            {activeTab === 'tools' && <AgentToolsManager />}
            {activeTab === 'permissions' && <AgentPermissions />}
            {activeTab === 'integrations' && <AgentIntegrations />}
            {activeTab === 'preferences' && <AgentPreferences />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
