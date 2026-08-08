'use client';

import React, { useEffect, useRef } from 'react';

interface NodeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulseOffset: number;
  color: string;
}

export default function InteractiveEmberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    // Initialize Autonomous Constellation Node Network (NO cursor circles/connections)
    const nodes: NodeParticle[] = [];
    const nodeCount = Math.min(Math.floor((width * height) / 16000), 80);
    const nodeColors = ['#00F0FF', '#BD10FF', '#0070CC', '#38BDF8', '#C084FC'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.2,
        pulseOffset: Math.random() * Math.PI * 2,
        color: nodeColors[Math.floor(Math.random() * nodeColors.length)]
      });
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // 1. Update Node Positions & Boundary Reflection
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
            const alpha = (1 - dist / connectionDist) * 0.28;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(0, 240, 255, ${alpha})`);
            grad.addColorStop(1, `rgba(189, 16, 255, ${alpha})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.9;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 3. Draw Ambient Node Particles (Pure ambient pulse, NO cursor circles/lines)
      nodes.forEach((node) => {
        const alpha = node.baseAlpha + Math.sin(frameCount * 0.03 + node.pulseOffset) * 0.15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, node.radius), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.shadowBlur = 10;
        ctx.shadowColor = node.color;
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
        background: '#02040a'
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
          background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.14) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle at center, rgba(189, 16, 255, 0.14) 0%, transparent 70%)',
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
