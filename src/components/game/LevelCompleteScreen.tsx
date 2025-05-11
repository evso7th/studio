
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
// import { Sparkles } from 'lucide-react'; // Sparkles icon is replaced

interface LevelCompleteScreenProps {
  currentLevel: number;
  onNextLevel: () => void;
}

interface FireworkParticle {
  id: number;
  x: string; // percentage string
  y: string; // percentage string
  size: number;
  color: string;
  delay: number; // animation delay
  duration: number; // animation duration
}

const FIREWORK_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--coin-color))',
  'hsl(var(--hero-color))',
  '#FFD700', // Gold
  '#FF69B4', // HotPink
  '#00FFFF', // Aqua
];

const NUM_FIREWORKS = 3; // Number of firework bursts
const PARTICLES_PER_FIREWORK = 15;

export function LevelCompleteScreen({ currentLevel, onNextLevel }: LevelCompleteScreenProps) {
  const [fireworks, setFireworks] = useState<FireworkParticle[][]>([]);

  useEffect(() => {
    const newFireworks: FireworkParticle[][] = [];
    for (let i = 0; i < NUM_FIREWORKS; i++) {
      const burst: FireworkParticle[] = [];
      // Randomize burst origin slightly more
      const burstOriginX = 20 + Math.random() * 60; // Burst origin X (20% to 80%)
      const burstOriginY = 20 + Math.random() * 40; // Burst origin Y (20% to 60%)

      for (let j = 0; j < PARTICLES_PER_FIREWORK; j++) {
        burst.push({
          id: i * PARTICLES_PER_FIREWORK + j,
          // Particles start at the burst origin then fly out
          x: `${burstOriginX + (Math.random() - 0.5) * 50}%`, // Target X after explosion
          y: `${burstOriginY + (Math.random() - 0.5) * 50}%`, // Target Y after explosion
          size: 4 + Math.random() * 4,
          color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
          delay: i * 0.5 + Math.random() * 0.3, // Stagger bursts and particles within bursts
          duration: 0.8 + Math.random() * 0.5,
        });
      }
      newFireworks.push(burst);
    }
    setFireworks(newFireworks);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="level-complete-title"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {fireworks.map((burst, burstIndex) =>
          burst.map((particle) => (
            <div
              key={particle.id}
              className="firework-particle"
              style={{
                left: `calc(${particle.x} - ${particle.size / 2}px)`,
                top: `calc(${particle.y} - ${particle.size / 2}px)`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))
        )}
      </div>

      <div className="bg-card text-card-foreground p-8 rounded-xl shadow-2xl text-center z-10 transform transition-all animate-in fade-in zoom-in-90 duration-500">
        <div className="mx-auto mb-4 h-16 w-16 relative">
          <Image 
            src="/assets/images/Superman.jpg" 
            alt="Superman" 
            width={64} 
            height={64} 
            className="rounded-full object-cover"
            data-ai-hint="superhero flying"
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

