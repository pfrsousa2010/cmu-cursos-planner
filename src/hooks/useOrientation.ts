import { useState, useEffect } from 'react';

interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
}

export const useOrientation = (): OrientationState => {
  const [orientation, setOrientation] = useState<OrientationState>({
    isPortrait: false,
    isLandscape: false,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      const isLandscape = width > height;

      setOrientation({
        isPortrait,
        isLandscape,
        width,
        height,
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
