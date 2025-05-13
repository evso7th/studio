
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditsDialog } from '@/components/landing/CreditsDialog';
import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { audioManager } from '@/lib/audioManager';
import { Preloader } from '@/components/landing/Preloader';
import type { GameState } from '@/lib/gameTypes'; 
import { LevelCompleteScreen } from '@/components/game/LevelCompleteScreen'; 
import { FinalScreen } from '@/components/game/FinalScreen'; 


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
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [backgroundFireworks, setBackgroundFireworks] = useState<FireworkParticle[]>([]);
  const [animatedTitle, setAnimatedTitle] = useState<string[]>(Array(TARGET_TITLE.length).fill('\u00A0'));
  const [showDebugLevelComplete, setShowDebugLevelComplete] = useState(false);
  const [showDebugFinalScreen, setShowDebugFinalScreen] = useState(false);
  const [debugCurrentLevel, setDebugCurrentLevel] = useState(1);
  

  useEffect(() => {
    // Example: To debug level complete screen for level 1
    // setShowDebugLevelComplete(true);
    // setDebugCurrentLevel(1);

    // Example: To debug final screen
    // setShowDebugFinalScreen(true);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    audioManager.preloadSounds();

    const titleChars = TARGET_TITLE.split('');
    const indices = titleChars.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    let currentAnimatedChars = Array(TARGET_TITLE.length).fill('\u00A0');
    let charRevealCount = 0;
    const titleIntervalTime = 100; 
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

    const assetLoadingTimeout = setTimeout(() => {
      setIsLoadingAssets(false);
    }, 1500); 

    return () => {
      clearInterval(titleIntervalId);
      clearInterval(fireworksIntervalId);
      clearTimeout(assetLoadingTimeout);
      audioManager.stopSound('First_screen'); 
    };
  }, []); 

  useEffect(() => {
    if (!isLoadingAssets && isMounted) {
      const playInitialSound = async () => { 
        if (!audioManager.isInitialized()) {
          try {
            await audioManager.initAudio(); 
          } catch (error) {
            console.warn("EntryPage: Audio initialization failed after preloader.", error);
          }
        }
        
        if (audioManager.isInitialized() && audioManager.getCurrentPlayingLoop() !== 'First_screen') {
          audioManager.playSound('First_screen');
        }
      };

      
      const soundTimeout = setTimeout(playInitialSound, 100);
      return () => clearTimeout(soundTimeout);
    }
  }, [isLoadingAssets, isMounted]);

  const requestFullscreen = useCallback(async () => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const element = document.documentElement as HTMLElement & {
        mozRequestFullScreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };

      try {
        if (document.fullscreenElement || 
            (document as any).webkitFullscreenElement || 
            (document as any).mozFullScreenElement || 
            (document as any).msFullscreenElement) {
          console.log("Already in fullscreen mode or request pending.");
          return Promise.resolve();
        }

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { /* Safari, Chrome */
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
          await element.msRequestFullscreen();
        } else {
          console.warn("Fullscreen API is not supported by this browser.");
        }
      } catch (err: any) {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`, err);
      }
    }
    return Promise.resolve();
  }, []);


  const handleStartGame = useCallback(async () => {
    await requestFullscreen(); 
    try {
      if (!audioManager.isInitialized()) {
        await audioManager.initAudio();
      }
      audioManager.stopSound('First_screen'); 
    } catch (error) {
      console.error("Failed to initialize/manage audio for game start:", error);
    }
    router.push('/play');
  }, [router, requestFullscreen]);

  if (!isMounted || isLoadingAssets) {
    return <Preloader />;
  }

  if (showDebugLevelComplete) {
    return <LevelCompleteScreen currentLevel={debugCurrentLevel} onNextLevel={() => {setShowDebugLevelComplete(false); router.push('/play');}}/>;
  }
  if (showDebugFinalScreen) {
    return <FinalScreen />;
  }

  return (
    <div 
      className="min-h-screen w-screen flex flex-col items-center justify-center text-foreground overflow-hidden relative p-0 m-0"
      style={{ 
        backgroundImage: 'url(/assets/images/wallpaper2.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'top center',
      }}
      data-ai-hint="starry sky space"
      role="img"
      aria-label="Background Wallpaper"
    >
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

      <div className="text-center w-full h-full flex flex-col items-center justify-between relative z-10 p-0 shadow-xl pt-12 pb-[50px] box-border">
        <div className="max-w-2xl w-full px-6 flex flex-col items-center h-full justify-between pt-12 pb-[50px] box-border">
          <div className="flex flex-col items-center">
            <h1 className="text-[44px] font-bold text-primary whitespace-nowrap pr-1 mr-1 ml-[-5px]">
              {animatedTitle.join('')}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 mt-[-10px]">
              Специальное издание <br />
              в честь Дня Рождения
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-accent mt-[-10px]">
              Руслана Гайнанова
            </p>
          </div>

          <div 
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto aspect-[4/3] my-4 animate-swirl-in"
            style={{
              backgroundImage: 'url(/assets/images/relaxman.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            role="img"
            aria-label="Relaxing Man"
            data-ai-hint="man relaxing business"
          />

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

