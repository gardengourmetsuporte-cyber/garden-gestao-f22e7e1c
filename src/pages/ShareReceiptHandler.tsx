import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';

/**
 * This page is the target of the PWA Share Target API.
 * The actual POST interception happens in the Service Worker (push-sw.js).
 * The SW stores the image in Cache Storage and redirects here.
 * This component just redirects to /finance?receipt=shared.
 */
export default function ShareReceiptHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/finance?receipt=shared', { replace: true });
  }, [navigate]);

  return <PageLoader />;
}
