export function isIosStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isIos = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;

  return isIos && isStandalone;
}

export function shouldAutoScrollOnFocus(): boolean {
  return !isIosStandaloneMode();
}
