import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';

/**
 * PWA Share Target handler.
 * Receives shared images and redirects to the dashboard where the Smart Scanner lives.
 * The SW stores the image in Cache Storage and redirects here.
 */
export default function ShareReceiptHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard with a flag so it can pick up the shared image
    navigate('/?scanner=shared', { replace: true });
  }, [navigate]);

  return <PageLoader />;
}
