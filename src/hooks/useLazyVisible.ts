import { useState, useRef, useEffect } from 'react';

/**
 * Returns true once the sentinel element enters the viewport.
 * Use to defer rendering of below-fold dashboard widgets.
 */
export function useLazyVisible(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return { ref, visible };
}
