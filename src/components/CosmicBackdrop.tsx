import { useEffect, useRef, useState } from 'react';

interface CosmicBackdropProps {
  dimmed?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export function CosmicBackdrop({ dimmed = false }: CosmicBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const palette = [
      'rgba(56, 189, 248, 0.85)', // Neon sky blue
      'rgba(139, 92, 246, 0.8)',  // Electric violet
      'rgba(251, 191, 36, 0.75)', // Celestial gold
      'rgba(226, 232, 240, 0.7)', // Starlight white
    ];

    const particleCount = Math.min(65, Math.max(28, Math.floor((width * height) / 26000)));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.7,
      alpha: Math.random() * 0.6 + 0.25,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Subtle energy lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 15000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.22)';
            ctx.globalAlpha = (1 - distSq / 15000) * 0.35;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-[#060813] pointer-events-none"
      aria-hidden="true"
    >
      {!imgFailed && (
        <img
          src="/src/assets/images/quizverse_arena_backdrop_1795601604382.jpg"
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            dimmed ? 'opacity-15' : 'opacity-35'
          }`}
        />
      )}

      {/* Atmospheric radial glow mesh */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.14), transparent 45%), radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.16), transparent 48%), radial-gradient(circle at 50% 85%, rgba(245, 158, 11, 0.08), transparent 45%)',
        }}
      />

      {/* Contrast scrim */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          dimmed ? 'bg-[#04050c]/88' : 'bg-[#060813]/65'
        }`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
