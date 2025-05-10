
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
  trailAngle: number; // For trail effect
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
const PARTICLES_PER_BACKGROUND_FIREWORK = 15; 
const FIREWORK_REGENERATION_INTERVAL = 4000; // Regenerate fireworks every 4 seconds

export default function EntryPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [backgroundFireworks, setBackgroundFireworks] = useState<FireworkParticle[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof screen.orientation?.lock === 'function') {
      screen.orientation.lock('portrait-primary')
        .then(() => console.log('Screen orientation locked to portrait.'))
        .catch((error) => console.warn('Screen orientation lock failed. This is common if not triggered by user action or if the API is unsupported/restricted.', error));
    } else {
      console.warn('Screen Orientation API not supported.');
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const generatePageFireworks = () => {
      const newFireworks: FireworkParticle[] = [];
      for (let i = 0; i < NUM_BACKGROUND_FIREWORKS; i++) {
        const originXNum = 5 + Math.random() * 90; 
        const originYNum = 5 + Math.random() * 90; 

        for (let j = 0; j < PARTICLES_PER_BACKGROUND_FIREWORK; j++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 25 + 15; 
          
          const targetOffsetXNum = Math.cos(angle) * radius;
          const targetOffsetYNum = Math.sin(angle) * radius;

          const particleTrailAngleDeg = (Math.atan2(targetOffsetYNum, targetOffsetXNum) * (180 / Math.PI)) - 90;

          newFireworks.push({
            id: Date.now() + i * PARTICLES_PER_BACKGROUND_FIREWORK + j + Math.random(),
            originX: `${originXNum}%`,
            originY: `${originYNum}%`,
            targetOffsetX: `${targetOffsetXNum}vmin`, 
            targetOffsetY: `${targetOffsetYNum}vmin`,
            size: (2 + Math.random() * 2.5) * 2 * 2, 
            color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
            delay: Math.random() * (FIREWORK_REGENERATION_INTERVAL / 1000 / 2), 
            duration: 1.5 + Math.random() * 1, 
            trailAngle: particleTrailAngleDeg,
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
    return null; 
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center text-foreground overflow-hidden relative p-0 m-0">
      <Image
        src="/assets/images/Wallpaper2.jpg" 
        alt="Background Wallpaper"
        fill
        style={{ objectFit: 'cover', zIndex: -10, objectPosition: 'top center' }} 
        priority
        data-ai-hint="starry sky space"
      />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {backgroundFireworks.map((particle) => (
          <div
            key={particle.id}
            className="firework-particle" 
            style={{
              left: particle.originX,
              top: particle.originY,
              width: `${particle.size}px`, 
              height: `${particle.size}px`, 
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

      <div className="text-center w-full h-full flex flex-col items-center justify-between relative z-10 p-0 shadow-xl pt-3 pb-[50px]">
        <div className="max-w-2xl w-full px-6 flex flex-col items-center h-full justify-between"> 
          {/* Top text block */}
          <div className="flex flex-col items-center">
            <h1 className="text-[44px] font-bold text-primary whitespace-nowrap pr-1 mr-1 ml-[-5px]">IPO Mad Racing</h1>
            <p className="text-xl md:text-2xl text-foreground/90 mt-1">
              Специальное издание <br />
              в честь Дня Рождения
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-accent mt-1">
              Руслана Гайнанова
            </p>
          </div>

          {/* Middle image */}
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto aspect-[4/3] my-4">
            <Image
              src="/assets/images/RelaxMan.png"
              alt="Relaxing Man"
              fill
              style={{ objectFit: 'contain' }}
              data-ai-hint="man relaxing business"
              priority
            />
          </div>

          {/* Bottom controls and text */}
          <div className="flex flex-col items-center w-full">
            <Button
              onClick={() => router.push('/play')}
              variant="destructive"
              size="lg"
              className="w-full max-w-xs text-xl py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 mb-2.5" 
            >
              Начать игру
            </Button>

            <div className="mb-2.5 w-full max-w-xs">  
               <CreditsDialog />
            </div>
            
            <p className="text-md md:text-lg text-muted-foreground"> 
              Собери все монетки и выйди на IPO!
              <br />
              Опасайся медведей!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
