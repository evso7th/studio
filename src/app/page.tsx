
"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditsDialog } from '@/components/landing/CreditsDialog';
import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { audioManager } from '@/lib/audioManager';

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
  '#FFD700', 
  '#FF69B4', 
  '#00FFFF', 
  '#DA70D6', 
  '#FF7F50', 
];

const NUM_BACKGROUND_FIREWORKS = 7; 
const PARTICLES_PER_BACKGROUND_FIREWORK = 15; 
const FIREWORK_REGENERATION_INTERVAL = 4000; 

const TARGET_TITLE = "IPO Mad Racing";

export default function EntryPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [backgroundFireworks, setBackgroundFireworks] = useState<FireworkParticle[]>([]);
  const [animatedTitle, setAnimatedTitle] = useState<string[]>(Array(TARGET_TITLE.length).fill('\u00A0')); 

  useEffect(() => {
    setIsMounted(true);
    audioManager.preloadSounds(); 
    if (typeof screen.orientation?.lock === 'function') {
      screen.orientation.lock('portrait-primary')
        .then(() => console.log('Screen orientation locked to portrait.'))
        .catch((error) => console.warn('Screen orientation lock failed.', error));
    } else {
      console.warn('Screen Orientation API not supported.');
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const titleChars = TARGET_TITLE.split('');
    const indices = titleChars.map((_, i) => i);

    // Shuffle indices for random appearance order
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let currentAnimatedChars = Array(TARGET_TITLE.length).fill('\u00A0');
    let charRevealCount = 0;
    const titleIntervalTime = 100; // 0.1 seconds

    const titleIntervalId = setInterval(() => {
      if (charRevealCount < indices.length) {
        const indexToReveal = indices[charRevealCount];
        currentAnimatedChars[indexToReveal] = titleChars[indexToReveal];
        setAnimatedTitle([...currentAnimatedChars]);
        charRevealCount++;
      } else {
        clearInterval(titleIntervalId);
      }
    }, titleIntervalTime);
    
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
    const fireworksIntervalId = setInterval(generatePageFireworks, FIREWORK_REGENERATION_INTERVAL);

    return () => {
      clearInterval(titleIntervalId);
      clearInterval(fireworksIntervalId);
      audioManager.stopSound('First_screen');
    };
  }, [isMounted]);

  const handleStartGame = useCallback(async () => {
    try {
      await audioManager.initAudio();
      audioManager.playSound('First_screen');
    } catch (error) {
      console.error("Failed to initialize or play startup audio:", error);
    }
    router.push('/play');
  }, [router]);

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
          <div className="flex flex-col items-center">
            <h1 className="text-[44px] font-bold text-primary whitespace-nowrap pr-1 mr-1 ml-[-5px]">
              {animatedTitle.join('')}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 mt-1">
              Специальное издание <br />
              в честь Дня Рождения
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-accent mt-1">
              Руслана Гайнанова
            </p>
          </div>

          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto aspect-[4/3] my-4">
            <Image
              src="/assets/images/RelaxMan.png"
              alt="Relaxing Man"
              fill
              style={{ objectFit: 'contain' }}
              className="animate-swirl-in" 
              data-ai-hint="man relaxing business"
              priority
            />
          </div>

          <div className="flex flex-col items-center w-full">
            <Button
              onClick={handleStartGame}
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

