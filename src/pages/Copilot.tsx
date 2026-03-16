import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { AgentPromptEditor } from '@/components/copilot/AgentPromptEditor';
import { CopilotKnowledgeBase } from '@/components/copilot/CopilotKnowledgeBase';
import { AgentToolsManager } from '@/components/copilot/AgentToolsManager';
import { AgentPermissions } from '@/components/copilot/AgentPermissions';
import { AgentIntegrations } from '@/components/copilot/AgentIntegrations';
import { AgentPreferences } from '@/components/copilot/AgentPreferences';

const SECTIONS = [
  { key: 'personality', label: 'Personalidade', description: 'Prompt e tom de voz do agente', icon: 'Sparkles', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
  { key: 'knowledge', label: 'Base de Conhecimento', description: 'RAG e contexto dinâmico', icon: 'BookOpen', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { key: 'tools', label: 'Ferramentas', description: 'Capacidades e ações do agente', icon: 'Wrench', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { key: 'permissions', label: 'Permissões', description: 'Controle de acesso por papel', icon: 'Shield', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  { key: 'integrations', label: 'Integrações', description: 'MCPs e conexões externas', icon: 'Plug', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { key: 'preferences', label: 'Preferências', description: 'Idioma, horário e comportamento', icon: 'Settings', gradient: 'linear-gradient(135deg, #64748b, #475569)' },
];

export default function Copilot() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const ActiveComponent = activeSection ? {
    personality: AgentPromptEditor,
    knowledge: CopilotKnowledgeBase,
    tools: AgentToolsManager,
    permissions: AgentPermissions,
    integrations: AgentIntegrations,
    preferences: AgentPreferences,
  }[activeSection] : null;

  return (
    <AppLayout>
      <div className="min-h-screen pb-36 lg:pb-12">
        <div className="px-4 py-4 max-w-3xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-primary to-primary/70">
              <AppIcon name="Bot" className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground">Gerenciar Agente IA</h1>
              <p className="text-xs text-muted-foreground">Configure comportamento, conhecimento e ferramentas</p>
            </div>
          </div>

          {/* Grid or Detail */}
          {!activeSection ? (
            <div className="grid grid-cols-2 gap-3">
              {SECTIONS.map(section => (
                <button
                  key={section.key}
                  onClick={() => { navigator.vibrate?.(10); setActiveSection(section.key); }}
                  className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-border/50 bg-card hover:bg-card/80 transition-all duration-200 active:scale-[0.97] text-left group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
                    style={{ background: section.gradient }}
                  >
                    <AppIcon name={section.icon as any} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{section.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <AppIcon name="ArrowLeft" size={16} />
                <span>Voltar</span>
              </button>

              {/* Section header */}
              {(() => {
                const section = SECTIONS.find(s => s.key === activeSection);
                if (!section) return null;
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: section.gradient }}
                    >
                      <AppIcon name={section.icon as any} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{section.label}</h2>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Content */}
              {ActiveComponent && <ActiveComponent />}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
