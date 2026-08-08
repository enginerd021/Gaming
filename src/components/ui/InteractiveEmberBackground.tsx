'use client';

import React, { useEffect, useRef, useState } from 'react';

interface NodeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulseOffset: number;
  colorDark: string;
  colorLight: string;
}

export default function InteractiveEmberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // 1. Observe Theme Attribute Changes (light vs neon)
    const checkTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setIsLight(currentTheme === 'light');
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = window.innerWidth;
      height = canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Node Colors for Dark (Neon) & Light Theme
    const darkColors = ['#00F0FF', '#BD10FF', '#0070CC', '#38BDF8', '#C084FC'];
    const lightColors = ['#0284C7', '#6366F1', '#8B5CF6', '#0369A1', '#7C3AED'];

    const nodes: NodeParticle[] = [];
    const nodeCount = Math.min(Math.floor((width * height) / 16000), 80);

    for (let i = 0; i < nodeCount; i++) {
      const colorIndex = Math.floor(Math.random() * darkColors.length);
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.25,
        pulseOffset: Math.random() * Math.PI * 2,
        colorDark: darkColors[colorIndex],
        colorLight: lightColors[colorIndex]
      });
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // Check current active theme
      const lightActive = document.documentElement.getAttribute('data-theme') === 'light';

      // 1. Update Node Positions & Bounds
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });

      // 2. Draw Inter-Node Constellation Laser Connections
      const connectionDist = 140;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const rawAlpha = (1 - dist / connectionDist);
            const alpha = lightActive ? (rawAlpha * 0.35).toFixed(2) : (rawAlpha * 0.28).toFixed(2);
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);

            if (lightActive) {
              grad.addColorStop(0, `rgba(2, 132, 199, ${alpha})`);
              grad.addColorStop(1, `rgba(124, 58, 237, ${alpha})`);
              ctx.lineWidth = 1.0;
            } else {
              grad.addColorStop(0, `rgba(0, 240, 255, ${alpha})`);
              grad.addColorStop(1, `rgba(189, 16, 255, ${alpha})`);
              ctx.lineWidth = 0.9;
            }

            ctx.strokeStyle = grad;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 3. Draw Ambient Node Particles
      nodes.forEach((node) => {
        const alpha = node.baseAlpha + Math.sin(frameCount * 0.03 + node.pulseOffset) * 0.15;
        const color = lightActive ? node.colorLight : node.colorDark;

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, node.radius), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = lightActive ? Math.min(0.9, alpha * 1.3) : Math.max(0.1, alpha);
        ctx.shadowBlur = lightActive ? 4 : 10;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
        background: isLight ? 'var(--bg-primary)' : '#02040a'
      }}
    >
      {/* Soft Ambient Corner Cyber Glows */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '5%',
          width: '50vw',
          height: '550px',
          background: isLight
            ? 'radial-gradient(circle at center, rgba(79, 70, 229, 0.07) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(0, 240, 255, 0.14) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '50vw',
          height: '550px',
          background: isLight
            ? 'radial-gradient(circle at center, rgba(124, 58, 237, 0.07) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(189, 16, 255, 0.14) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />

      {/* Constellation Nodes Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
