import { useEffect, useState } from 'react';

/**
 * Hook que detecta se o usuário prefere reduzir movimento
 * Respeita a configuração do SO: Settings > Accessibility > Display > Reduce Motion
 */
export const useReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Detectar preferência inicial
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    // Escutar mudanças (usuário muda preferência)
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    // Usar addEventListener (mais compatível que onchange)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback para browsers antigos
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  return prefersReduced;
};

/**
 * Hook que retorna configuração de animação baseada em preferência
 * Uso com Framer Motion ou CSS transitions
 */
export const useAnimationConfig = () => {
  const prefersReduced = useReducedMotion();

  return {
    // Se usuário prefere reduzir: sem animação
    // Senão: animação normal
    duration: prefersReduced ? 0 : 0.3,
    transition: prefersReduced
      ? { duration: 0 }
      : { type: 'spring', stiffness: 300, damping: 30 },
  };
};
