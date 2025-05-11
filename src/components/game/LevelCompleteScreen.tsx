
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface LevelCompleteScreenProps {
  currentLevel: number;
  onNextLevel: () => void;
}

interface FireworkParticle {
  id: number;
  originX: string; 
  originY: string; 
  targetOffsetX: string; 
  targetOffsetY: string;
  size: number;
  color: string;
  delay: number;
  duration: number;
  trailAngle: number;
}

const FIREWORK_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--coin-color))',
  'hsl(var(--hero-color))',
  '#FFD700', // Gold
  '#FF69B4', // HotPink
  '#00FFFF', // Aqua
  '#DA70D6', // Orchid
  '#FF7F50', // Coral
];

const NUM_PAGE_FIREWORKS = 5; 
const PARTICLES_PER_PAGE_FIREWORK = 12;
const FIREWORK_REGENERATION_INTERVAL_LCS = 3500; 


export function LevelCompleteScreen({ currentLevel, onNextLevel }: LevelCompleteScreenProps) {
  const [pageFireworks, setPageFireworks] = useState<FireworkParticle[]>([]);

  useEffect(() => {
    const generateFireworks = () => {
      const newFireworks: FireworkParticle[] = [];
      for (let i = 0; i < NUM_PAGE_FIREWORKS; i++) {
        const originXNum = 10 + Math.random() * 80; 
        const originYNum = 10 + Math.random() * 80; 

        for (let j = 0; j < PARTICLES_PER_PAGE_FIREWORK; j++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20 + 10;
          
          const targetOffsetXNum = Math.cos(angle) * radius;
          const targetOffsetYNum = Math.sin(angle) * radius;
          const particleTrailAngleDeg = (Math.atan2(targetOffsetYNum, targetOffsetXNum) * (180 / Math.PI)) - 90;

          newFireworks.push({
            id: Date.now() + i * PARTICLES_PER_PAGE_FIREWORK + j + Math.random(),
            originX: `${originXNum}%`,
            originY: `${originYNum}%`,
            targetOffsetX: `${targetOffsetXNum}vmin`,
            targetOffsetY: `${targetOffsetYNum}vmin`,
            size: (2 + Math.random() * 2) * 2 * 2, 
            color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
            delay: Math.random() * (FIREWORK_REGENERATION_INTERVAL_LCS / 1000 / 2.5),
            duration: 1.2 + Math.random() * 0.8,
            trailAngle: particleTrailAngleDeg,
          });
        }
      }
      setPageFireworks(newFireworks);
    };

    generateFireworks();
    const intervalId = setInterval(generateFireworks, FIREWORK_REGENERATION_INTERVAL_LCS);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 p-4 animate-in fade-in duration-700"
      aria-modal="true"
      role="dialog"
      aria-labelledby="level-complete-title"
    >
      <Image
        src="/assets/images/Wallpaper1.jpg"
        alt="Celebration Background"
        fill
        style={{ objectFit: 'cover', zIndex: -1 }}
        priority
        data-ai-hint="abstract celebration"
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0"> {/* Fireworks container, z-index ensures it's above background but below dialog */}
        {pageFireworks.map((particle) => (
          <div
            key={particle.id}
            className="firework-particle"
            style={{
              left: particle.originX,
              top: particle.originY,
              backgroundColor: particle.color,
              '--tx': particle.targetOffsetX,
              '--ty': particle.targetOffsetY,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              '--particle-initial-size': `${particle.size}px`,
              '--trail-angle': `${particle.trailAngle}deg`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="bg-card text-card-foreground p-8 rounded-xl shadow-2xl text-center z-10 transform transition-all animate-in fade-in zoom-in-90 duration-1000"> {/* Dialog content, z-index 10 ensures it's above background and fireworks */}
        <div className="mx-auto mb-4 h-32 w-32 relative"> {/* Container for Superman image */}
          <Image 
            src="/assets/images/Superman.png" 
            alt="Superman character" 
            width={128} 
            height={128} 
            className="rounded-full object-cover animate-image-glow"
            data-ai-hint="superhero character"
          />
        </div>
        <h2 id="level-complete-title" className="text-3xl md:text-4xl font-bold mb-3 text-primary">
          Поздравляем!
        </h2>
        <p className="text-xl md:text-2xl mb-8 text-foreground/90">
          Вы прошли уровень {currentLevel}!
        </p>
        <Button 
          onClick={onNextLevel} 
          size="lg" 
          className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          aria-label={`Перейти на уровень ${currentLevel + 1}`}
        >
          Уровень {currentLevel + 1}
        </Button>
      </div>
    </div>
  );
}

