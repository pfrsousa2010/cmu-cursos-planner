import { useState, useEffect } from 'react';

interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
}

export const useOrientation = (): OrientationState => {
  const [orientation, setOrientation] = useState<OrientationState>({
    isPortrait: false,
    isLandscape: false,
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
  });

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detectar orientação baseada na proporção da tela
      const isPortrait = height > width;
      const isLandscape = width > height;

      // Detectar tipo de dispositivo baseado na largura da tela
      const isMobile = width <= 800; // Mobile: até 768px
      const isTablet = width > 800 && width <= 1024; // Tablet: 768px a 1024px

      setOrientation({
        isPortrait,
        isLandscape,
        width,
        height,
        isMobile,
        isTablet,
      });
    };

    // Verificar orientação inicial
    updateOrientation();

    // Adicionar listener para mudanças de orientação
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
};
