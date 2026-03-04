import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { AppIcon } from '@/components/ui/app-icon';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { UpgradeWall } from '@/components/paywall/UpgradeWall';
import { useAuth } from '@/contexts/AuthContext';
import { BrandIdentityTab } from '@/components/brand/BrandIdentityTab';
import { BrandGalleryTab } from '@/components/brand/BrandGalleryTab';
import { BrandReferencesTab } from '@/components/brand/BrandReferencesTab';
import { BrandAIPanel } from '@/components/brand/BrandAIPanel';

export default function BrandCore() {
  const { hasPlan } = useAuth();
  const [activeTab, setActiveTab] = useState('identity');
  useScrollToTopOnChange(activeTab);

  if (!hasPlan('business')) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <UpgradeWall moduleKey="marketing" moduleLabel="Brand Core" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <AppIcon name="Palette" size={20} className="text-primary" />
            <h1 className="text-lg font-bold">Brand Core</h1>
          </div>

          <AnimatedTabs
            tabs={[
              { key: 'identity', label: 'Identidade', icon: <AppIcon name="Palette" size={16} /> },
              { key: 'gallery', label: 'Galeria', icon: <AppIcon name="Image" size={16} /> },
              { key: 'references', label: 'Referências', icon: <AppIcon name="BookOpen" size={16} /> },
              { key: 'ai', label: 'IA', icon: <AppIcon name="Sparkles" size={16} /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'identity' && <BrandIdentityTab />}
            {activeTab === 'gallery' && <BrandGalleryTab />}
            {activeTab === 'references' && <BrandReferencesTab />}
            {activeTab === 'ai' && <BrandAIPanel />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
