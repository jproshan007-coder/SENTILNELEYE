import React, { useEffect, useRef } from 'react';

export default function ThreatGlobe3D({ activeAlerts = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    // Resize canvas
    const width = canvas.width = canvas.parentElement.clientWidth || 320;
    const height = canvas.height = canvas.parentElement.clientHeight || 280;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Camera nodes in 3D sphere coordinates (phi, theta)
    const cameraNodes = [
      { id: "CAM-01", name: "Vault", phi: 0.2, theta: 0.5, color: "#00F0FF" },
      { id: "CAM-02", name: "Atrium", phi: 1.2, theta: 2.1, color: "#FF2E4D" },
      { id: "CAM-03", name: "Alley", phi: 2.1, theta: 4.2, color: "#FFB800" },
      { id: "CAM-04", name: "Server", phi: 2.8, theta: 5.5, color: "#00E676" },
    ];

    // Background particles
    const particles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * width * 0.9,
      y: (Math.random() - 0.5) * height * 0.9,
      z: (Math.random() - 0.5) * 200,
      size: Math.random() * 1.8 + 0.8
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angle += 0.015;

      // Draw background ambient grid
      ctx.strokeStyle = "rgba(0, 240, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
      ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Radar Sweep Line
      const sweepX = cx + Math.cos(angle) * radius;
      const sweepY = cy + Math.sin(angle) * radius;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle - 0.4, angle);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw 3D Orbiting Latitude / Longitude lines
      for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += Math.PI / 6) {
        ctx.beginPath();
        const rLat = radius * Math.cos(lat);
        const yLat = cy + radius * Math.sin(lat) * 0.4;
        ctx.ellipse(cx, yLat, rLat, rLat * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
        ctx.stroke();
      }

      // Render 3D Floating Particles
      particles.forEach((p) => {
        const cosA = Math.cos(angle * 0.5);
        const sinA = Math.sin(angle * 0.5);
        const rx = p.x * cosA - p.z * sinA;
        const rz = p.x * sinA + p.z * cosA;
        const scale = 200 / (200 + rz);
        const px = cx + rx * scale;
        const py = cy + p.y * scale;

        ctx.fillStyle = `rgba(0, 240, 255, ${Math.max(0.1, scale - 0.4)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Camera Node Beacons & Threat Beams
      cameraNodes.forEach((node) => {
        const curTheta = node.theta + angle;
        const nx = cx + radius * Math.cos(curTheta) * Math.sin(node.phi);
        const ny = cy + radius * Math.sin(curTheta) * 0.4 + (node.phi - Math.PI / 2) * 20;

        const hasActiveAlert = activeAlerts.some((a) => a.camera_id === node.id);

        // Node Glow Ring
        ctx.beginPath();
        ctx.arc(nx, ny, hasActiveAlert ? 10 : 6, 0, Math.PI * 2);
        ctx.fillStyle = hasActiveAlert ? 'rgba(255, 46, 77, 0.3)' : 'rgba(0, 240, 255, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, hasActiveAlert ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = hasActiveAlert ? '#FF2E4D' : node.color;
        ctx.fill();

        // Laser beam connecting node to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = hasActiveAlert ? 'rgba(255, 46, 77, 0.7)' : 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = hasActiveAlert ? 2 : 1;
        ctx.stroke();

        // Node Text Tag
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = hasActiveAlert ? '#FF2E4D' : '#94A3B8';
        ctx.fillText(`${node.id}`, nx + 8, ny + 3);
      });

      // Center Core Security Orb
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#00F0FF';
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeAlerts]);

  return (
    <div className="relative w-full h-full glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between overflow-hidden">
      {/* Visual Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-cyan-400">
            3D SPATIAL THREAT RADAR
          </h3>
          <p className="text-[11px] font-mono text-slate-400">Real-time CCTV Node Vectors</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
          3D MATRIX
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full relative min-h-[220px] flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      {/* Visual Legend */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 z-10 pt-2 border-t border-slate-800/80">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Active Node
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" /> Threat Laser
        </span>
        <span className="text-slate-500">RADIUS: 100m</span>
      </div>
    </div>
  );
}
