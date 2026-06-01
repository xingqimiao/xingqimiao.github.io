'use client';

import { useEffect, useRef } from 'react';

export default function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // This logs once when mounted and ensures it is persistent across route changes.
    console.log('✨ [CanvasBackground] mounted. This canvas background remains mounted during page navigation.');
    
    // Placeholder animation setup can be placed here in the future.
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Subtle breathing or particle placeholder effect
    let count = 0;
    const render = () => {
      count += 0.01;
      // We can draw a simple indicator or clear the canvas to keep it performing well
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Let's keep it empty for now, as it's a placeholder for future particle effects.
      
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      console.log('🛑 [CanvasBackground] unmounted');
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-transparent"
      id="global-canvas-background"
    />
  );
}
