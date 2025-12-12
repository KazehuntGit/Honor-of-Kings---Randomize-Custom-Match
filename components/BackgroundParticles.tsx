import React, { useEffect, useState } from 'react';

export const BackgroundParticles: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number; left: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate static particles for SSR/Initial render
    const count = 20;
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100, // %
        size: Math.random() * 4 + 2, // px
        duration: Math.random() * 10 + 10, // s
        delay: Math.random() * 10, // s
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Fog Layers */}
      <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/yoshiharuyamashita/css-fog-animation/master/img/fog1.png')] bg-repeat-x bg-cover opacity-20 animate-fog"></div>
      <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/yoshiharuyamashita/css-fog-animation/master/img/fog2.png')] bg-repeat-x bg-cover opacity-10 animate-fog" style={{ animationDirection: 'reverse', animationDuration: '30s' }}></div>
      
      {/* Rising Embers */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle-ember"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.delay}s`, // Negative delay to start mid-animation
          }}
        />
      ))}

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#05090f_90%)]"></div>
    </div>
  );
};