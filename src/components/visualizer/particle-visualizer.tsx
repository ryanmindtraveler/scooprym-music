'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface ParticleVisualizerProps {
  isPlaying: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function ParticleVisualizer({ isPlaying, className }: ParticleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    contextRef.current = ctx;

    // "Lighter" creates the glowing light effect where overlaps become brighter
    ctx.globalCompositeOperation = 'lighter';

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Simulation parameters
    const particleCount = 60; // Fewer but softer particles
    const spectrumCount = 120; // Fine beams
    const dataArray = new Uint8Array(spectrumCount);

    // Colors: Cyan to Violet
    const getColor = (intensity: number) => {
      // value 0-1
      // Cyan: 6, 182, 212
      // Violet: 139, 92, 246
      const r = 6 + (139 - 6) * intensity;
      const g = 182 + (92 - 182) * intensity;
      const b = 212 + (246 - 212) * intensity;
      return `rgba(${r}, ${g}, ${b}`;
    };

    const render = () => {
      // Fade out trail
      // composite source-over needed for fade rect, then back to lighter
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Slower fade for more trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // Radius matches the container orb roughly
      const baseRadius = Math.min(centerX, centerY) * 0.55;

      // Simulate Audio Data
      if (isPlaying) {
        for (let i = 0; i < spectrumCount; i++) {
          // Smooth sine waves + noise for "premium" fake audio
          const time = Date.now() / 1000;
          const noise = Math.random() * 0.3;
          const wave = (Math.sin(i * 0.2 + time * 5) + 1) * 0.5;
          dataArray[i] = Math.max(50, (wave * 0.7 + noise * 0.3) * 255);
        }
      } else {
        for (let i = 0; i < spectrumCount; i++) {
          dataArray[i] = Math.max(0, dataArray[i] * 0.9); // decay
        }
      }

      // Draw Spectrum Beams
      const angleStep = (Math.PI * 2) / spectrumCount;

      for (let i = 0; i < spectrumCount; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const angle = i * angleStep;

        // Beam length
        const length = percent * 60 + 10;

        // Start point (on the album art edge)
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;

        // End point (radiating out)
        const x2 = centerX + Math.cos(angle) * (baseRadius + length);
        const y2 = centerY + Math.sin(angle) * (baseRadius + length);

        // Beam Color
        const alpha = percent * 0.8;
        const color = getColor(percent);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `${color}, 0)`); // fade in at start
        gradient.addColorStop(0.5, `${color}, ${alpha})`); // bright middle
        gradient.addColorStop(1, `${color}, 0)`); // fade out tip

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Chance to spawn particle from high energy
        if (isPlaying && percent > 0.8 && Math.random() < 0.1) {
          spawnParticle(x2, y2, angle, percent);
        }
      }

      // Draw & Update Particles
      updateParticles();

      animationRef.current = requestAnimationFrame(render);
    };

    const spawnParticle = (x: number, y: number, angle: number, intensity: number) => {
      if (particlesRef.current.length > particleCount) return;

      const speed = Math.random() * 1.5 + 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 4 + 2, // fuzzy size
        color: getColor(intensity),
      });
    };

    const updateParticles = () => {
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.98; // shrink

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Draw Soft Particle
        const alpha = p.life;
        // Radial gradient for "glow" ball look
        const grad = contextRef.current!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `${p.color}, ${alpha})`);
        grad.addColorStop(1, `${p.color}, 0)`);

        contextRef.current!.fillStyle = grad;
        contextRef.current!.beginPath();
        contextRef.current!.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        contextRef.current!.fill();
      }
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying]);

  return <canvas ref={canvasRef} className={cn('block w-full h-full opacity-80 mix-blend-screen', className)} />;
}
