
"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditsDialog } from '@/components/landing/CreditsDialog';
import { useState, useEffect } from 'react';
import type React from 'react';

interface FireworkParticle {
  id: number;
  originX: string; // percentage string for burst start
  originY: string; // percentage string for burst start
  targetOffsetX: string; // percentage string for animation translation
  targetOffsetY: string; // percentage string for animation translation
  size: number;
  color: string;
  delay: number;
  duration: number;
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

const NUM_BACKGROUND_FIREWORKS = 7; // Number of simultaneous firework bursts
const PARTICLES_PER_BACKGROUND_FIREWORK = 10; // Particles per burst
const FIREWORK_REGENERATION_INTERVAL = 4000; // Regenerate fireworks every 4 seconds

export default function EntryPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [backgroundFireworks, setBackgroundFireworks] = useState<FireworkParticle[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const generatePageFireworks = () => {
      const newFireworks: FireworkParticle[] = [];
      for (let i = 0; i < NUM_BACKGROUND_FIREWORKS; i++) {
        const originXNum = 5 + Math.random() * 90; // Burst origin X (5% to 95%)
        const originYNum = 5 + Math.random() * 90; // Burst origin Y (5% to 95%)

        for (let j = 0; j < PARTICLES_PER_BACKGROUND_FIREWORK; j++) {
          const angle = Math.random() * Math.PI * 2;
          // Make explosion radius vary for more dynamic look
          const radius = Math.random() * 25 + 15; // Explosion radius in viewport % (e.g., 15% to 40% of viewport smaller dimension)
          
          const targetOffsetX = Math.cos(angle) * radius;
          const targetOffsetY = Math.sin(angle) * radius;

          newFireworks.push({
            id: Date.now() + i * PARTICLES_PER_BACKGROUND_FIREWORK + j + Math.random(),
            originX: `${originXNum}%`,
            originY: `${originYNum}%`,
            targetOffsetX: `${targetOffsetX}vmin`, // Use vmin for radius relative to smaller viewport dimension
            targetOffsetY: `${targetOffsetY}vmin`,
            size: 2 + Math.random() * 2.5, // Particle size
            color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
            delay: Math.random() * (FIREWORK_REGENERATION_INTERVAL / 1000 / 2), // Delay spread over half the interval
            duration: 1.5 + Math.random() * 1, // Duration of particle animation
          });
        }
      }
      setBackgroundFireworks(newFireworks);
    };

    generatePageFireworks();
    const intervalId = setInterval(generatePageFireworks, FIREWORK_REGENERATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isMounted]);

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center text-foreground p-4 overflow-hidden relative">
      {/* Fullscreen Background Image */}
      <Image
        src="/assets/images/Wallpaper2.jpg" // Corrected path
        alt="Background Wallpaper"
        fill
        style={{ objectFit: 'cover', zIndex: -10 }} // Ensure it's behind everything
        priority
        data-ai-hint="starry sky space"
      />
      
      {/* Fireworks Container (z-0 by default as it's later in DOM, or explicitly z-0/positive if needed) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {backgroundFireworks.map((particle) => (
          <div
            key={particle.id}
            className="firework-particle" // Use existing class from globals.css
            style={{
              left: particle.originX,
              top: particle.originY,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              // CSS variables for the 'firework-explode' animation
              '--tx': particle.targetOffsetX,
              '--ty': particle.targetOffsetY,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            } as React.CSSProperties} // Type assertion for CSS variables
          />
        ))}
      </div>

      {/* Main Content (needs to be above fireworks) */}
      <div className="text-center space-y-6 max-w-2xl w-full relative z-10 bg-background/70 p-6 rounded-lg shadow-xl">
        <h1 className="text-5xl md:text-7xl font-bold text-primary">IPO Mad Racing</h1>
        <p className="text-xl md:text-2xl text-foreground/90">
          Специальное издание <br />
          в честь дня рождения
        </p>
        <p className="text-2xl md:text-3xl font-semibold text-accent">
          Руслана Гайнанова
        </p>

        <div className="relative w-full max-w-md mx-auto aspect-[4/3] my-8">
          <Image
            src="/assets/images/RelaxMan.png"
            alt="Relaxing Man"
            fill
            style={{ objectFit: 'contain' }}
            data-ai-hint="man relaxing business"
            priority
          />
        </div>

        <Button
          onClick={() => router.push('/play')}
          variant="destructive"
          size="lg"
          className="w-full max-w-xs text-xl py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
        >
          Начать игру
        </Button>

        <CreditsDialog />

        <p className="text-md md:text-lg text-muted-foreground pt-6">
          Собери все монетки и выйди на IPO!
          <br />
          Опасайся медведей!
        </p>
      </div>
    </div>
  );
}

