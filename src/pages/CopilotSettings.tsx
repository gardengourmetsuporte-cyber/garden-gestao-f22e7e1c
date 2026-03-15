import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppIcon } from '@/components/ui/app-icon';
import { AgentPromptEditor } from '@/components/copilot/AgentPromptEditor';
import { CopilotKnowledgeBase } from '@/components/copilot/CopilotKnowledgeBase';
import { AgentToolsManager } from '@/components/copilot/AgentToolsManager';
import { AgentIntegrations } from '@/components/copilot/AgentIntegrations';

export default function CopilotSettings() {
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
              <p className="text-xs text-muted-foreground">Configure o comportamento, conhecimento e ferramentas do Copiloto</p>
            </div>
          </div>

          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="prompt" className="text-xs gap-1">
                <AppIcon name="MessageSquare" className="w-3.5 h-3.5 hidden sm:block" />
                Prompt
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="text-xs gap-1">
                <AppIcon name="BookOpen" className="w-3.5 h-3.5 hidden sm:block" />
                RAG
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs gap-1">
                <AppIcon name="Wrench" className="w-3.5 h-3.5 hidden sm:block" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="integrations" className="text-xs gap-1">
                <AppIcon name="Plug" className="w-3.5 h-3.5 hidden sm:block" />
                MCPs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompt">
              <AgentPromptEditor />
            </TabsContent>
            <TabsContent value="knowledge">
              <CopilotKnowledgeBase />
            </TabsContent>
            <TabsContent value="tools">
              <AgentToolsManager />
            </TabsContent>
            <TabsContent value="integrations">
              <AgentIntegrations />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
