import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/ui/app-icon';
import upgradeBannerImg from '@/assets/upgrade-banner.png';

export function UpgradeBanner() {
  const { isFree } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    const ts = sessionStorage.getItem('upgrade-banner-dismissed');
    return !!ts;
  });

  if (!isFree || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('upgrade-banner-dismissed', '1');
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden animate-fade-in cursor-pointer group mb-4"
      onClick={() => navigate('/plans')}
    >
      <img
        src={upgradeBannerImg}
        alt="Liberte o poder do Garden Gestão"
        className="w-full h-auto object-cover rounded-2xl"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors z-10"
        aria-label="Fechar"
      >
        <AppIcon name="X" size={16} />
      </button>
    </div>
  );
}
