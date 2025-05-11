
// @ts-nocheck
"use client";

import type { useEffect } from 'react';
import { useRef, useCallback, useEffect as useReactEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent, EnemyComponent } from '@/components/game/GameRenderer';
import { LevelCompleteScreen } from '@/components/game/LevelCompleteScreen';
import { FinalScreen } from '@/components/game/FinalScreen'; 
import type { GameState } from '@/lib/gameTypes';
import { HERO_APPEARANCE_DURATION_MS } from '@/lib/gameTypes';
import { Button } from "@/components/ui/button";
import { audioManager } from '@/lib/audioManager';

export default function PlayPage() {
  const { gameState, dispatch, gameTick } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

  const [parallaxBgX, setParallaxBgX] = useState(0);
  const initialHeroXRef = useRef<number | null>(null);
  const PARALLAX_FACTOR = 0.2;

  const [showDebugFinalScreen, setShowDebugFinalScreen] = useState(false); 

  useReactEffect(() => {
    if (dispatch && !showDebugFinalScreen) { 
      // dispatch({ type: 'SET_DEBUG_LEVEL_COMPLETE', payload: true }); 
      // dispatch({ type: 'SET_DEBUG_LEVEL', payload: 1 }); 
      // setShowDebugFinalScreen(true); 
      // dispatch({ type: 'SET_DEBUG_LEVEL', payload: 3 });
    }
  }, [dispatch, showDebugFinalScreen]);


  const updateGameAreaSize = useCallback(() => {
    if (gameAreaRef.current) {
      const { clientWidth, clientHeight } = gameAreaRef.current;
      const style = window.getComputedStyle(gameAreaRef.current);
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;

      const effectiveWidth = clientWidth;
      const effectiveHeight = clientHeight - paddingTop - paddingBottom;

      dispatch({ type: 'UPDATE_GAME_AREA', payload: { width: effectiveWidth, height: effectiveHeight, paddingTop: paddingTop } });
    }
  }, [dispatch]);

  useReactEffect(() => {
    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);
    if (typeof screen.orientation?.lock === 'function') {
      screen.orientation.lock('portrait-primary')
        .then(() => console.log('Screen orientation locked to portrait.'))
        .catch((error) => console.warn('Screen orientation lock failed.', error));
    } else {
      console.warn('Screen Orientation API not supported.');
    }
    
    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
      audioManager.stopAllSounds(); 
    };
  }, [updateGameAreaSize]);

  useReactEffect(() => {
    if (gameState.isGameInitialized) {
      audioManager.stopAllSounds();
      audioManager.playSound('New_level');
      const levelMusicMap = {
        1: 'Level1',
        2: 'Level2',
        3: 'Level3',
      };
      const musicToPlay = levelMusicMap[gameState.currentLevel];
      if (musicToPlay) {
        // Delay playing level music slightly to let "New_level" sound play first
        setTimeout(() => {
          if(gameState.currentLevel === parseInt(musicToPlay.replace('Level',''))) { // Check if level hasn't changed
             audioManager.playSound(musicToPlay);
          }
        }, 500); // Adjust delay as needed
      }
    }
  }, [gameState.currentLevel, gameState.isGameInitialized]);


  useReactEffect(() => {
    if (gameState.isGameInitialized && gameState.gameArea.width > 0 && initialHeroXRef.current === null && gameState.hero) {
      initialHeroXRef.current = gameState.hero.x;
    }
  }, [gameState.isGameInitialized, gameState.gameArea.width, gameState.hero]);

  useReactEffect(() => {
    if (gameState.isGameInitialized && initialHeroXRef.current !== null && gameState.hero) {
      const heroDisplacement = gameState.hero.x - initialHeroXRef.current;
      setParallaxBgX(-heroDisplacement * PARALLAX_FACTOR);
    }
  }, [gameState.hero?.x, gameState.isGameInitialized]);


  useReactEffect(() => {
    const loop = () => {
      if (gameState.isGameInitialized && gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && !gameState.levelCompleteScreenActive && !gameState.gameOver && !gameState.gameLost) {
         gameTick();
      }
      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameTick, gameState.isGameInitialized, gameState.gameArea.width, gameState.gameArea.height, gameState.levelCompleteScreenActive, gameState.gameOver, gameState.gameLost]);

  useReactEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showDebugFinalScreen || gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver) return;

      if (event.key === 'F5' || (event.ctrlKey && event.key.toLowerCase() === 'r')) return;
      if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') ||
          (event.metaKey && event.altKey && event.key.toLowerCase() === 'i') ||
          event.key === 'F12') return;

      let handled = false;
      switch (event.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          dispatch({ type: 'MOVE_LEFT_START' });
          handled = true;
          break;
        case 'arrowright':
        case 'd':
          dispatch({ type: 'MOVE_RIGHT_START' });
          handled = true;
          break;
        case 'arrowup':
        case 'w':
        case ' ':
          dispatch({ type: 'JUMP' });
          handled = true;
          break;
      }
      if (handled) {
          event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (showDebugFinalScreen || gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver) return;
      let handled = false;
      switch (event.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          dispatch({ type: 'MOVE_LEFT_STOP' });
          handled = true;
          break;
        case 'arrowright':
        case 'd':
          dispatch({ type: 'MOVE_RIGHT_STOP' });
          handled = true;
          break;
      }
      if (handled) {
          event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      dispatch({ type: 'MOVE_LEFT_STOP' });
      dispatch({ type: 'MOVE_RIGHT_STOP' });
    };
  }, [dispatch, gameState.heroAppearance, gameState.levelCompleteScreenActive, gameState.gameLost, gameState.gameOver, showDebugFinalScreen]);

  useReactEffect(() => {
    const preventZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };
    document.body.addEventListener('touchmove', preventZoom, { passive: false });
    document.body.style.touchAction = 'none'; 

    return () => {
      document.body.removeEventListener('touchmove', preventZoom);
      document.body.style.touchAction = ''; 
    };
  }, []);

  const handleExit = () => {
    audioManager.stopAllSounds();
    router.push('/');
  };

  const getBackgroundPosition = (level: number, pX: number): string => {
    switch (level) {
      case 1:
        return `${pX - 100}px center`;
      case 2:
        return `calc(50% + ${pX}px) 0%`; 
      case 3:
        return `calc(100% + ${pX}px - 100px) 0%`; 
      default:
        return `${pX - 100}px center`;
    }
  };

  if (showDebugFinalScreen) {
    return <FinalScreen />;
  }

  if (gameState.gameLost) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h2 className="text-4xl font-bold mb-4 text-destructive">Игра окончена!</h2>
        <p className="text-xl mb-8 text-center">Кажется, наш герой немного увлекся полетом...</p>
        <Button
          onClick={() => {
            audioManager.stopAllSounds(); // Stop sounds before restarting
            dispatch({ type: 'RESTART_LEVEL' });
          }}
          size="lg"
          className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Начать сначала
        </Button>
         <Button
          onClick={handleExit}
          variant="outline"
          size="lg"
          className="mt-4 text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Главное меню
        </Button>
      </div>
    );
  }

  if (gameState.levelCompleteScreenActive) {
    return (
      <LevelCompleteScreen
        currentLevel={gameState.currentLevel}
        onNextLevel={() => {
          audioManager.stopAllSounds(); // Stop sounds before next level
          dispatch({ type: 'NEXT_LEVEL' });
        }}
      />
    );
  }
  
  if (gameState.gameOver && gameState.currentLevel === 3 && !gameState.gameLost) {
     return <FinalScreen />;
  }


  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: 'hsl(var(--background))',
      }}
      aria-label="Главное окно игры"
    >
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <h1 className="text-xs font-normal text-white font-roboto shadow-md">IPO Mad Racing</h1>
        <div className="flex flex-col items-end">
            <p className="text-xs font-normal text-white font-roboto shadow-md">Level: {gameState.currentLevel}</p>
            <p className="text-xs font-normal text-white font-roboto shadow-md">Спасибки: {gameState.score}</p>
        </div>
      </header>

      <div
        ref={gameAreaRef}
        className="flex-grow relative w-full overflow-hidden pt-16 pb-20" 
        style={{
          backgroundImage: 'url("/assets/images/BackGroundBase.png")',
          backgroundSize: 'cover',
          backgroundPosition: getBackgroundPosition(gameState.currentLevel, parallaxBgX),
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'hsl(var(--game-bg))',
          perspective: '1000px',
        }}
        data-ai-hint="abstract pattern"
      >
        {gameState.isGameInitialized && gameState.gameArea.height > 0 && gameState.hero && (
          <>
            <HeroComponent
              hero={gameState.hero}
              gameAreaHeight={gameState.gameArea.height}
              paddingTop={gameState.paddingTop}
              heroAppearance={gameState.heroAppearance}
              heroAppearElapsedTime={gameState.heroAppearElapsedTime}
              heroAppearanceDuration={HERO_APPEARANCE_DURATION_MS}
            />
            {gameState.platforms.map(platform => (
              <PlatformComponent key={platform.id} platform={platform} gameAreaHeight={gameState.gameArea.height} paddingTop={gameState.paddingTop} />
            ))}
            {gameState.activeCoins.map(coin => (
              <CoinComponent key={coin.id} coin={coin} gameAreaHeight={gameState.gameArea.height} paddingTop={gameState.paddingTop} />
            ))}
            {gameState.enemies.map(enemy => (
              <EnemyComponent key={enemy.id} enemy={enemy} gameAreaHeight={gameState.gameArea.height} paddingTop={gameState.paddingTop} />
            ))}
          </>
        )}
      </div>

      <ControlPanel
        dispatch={dispatch}
        onExit={handleExit}
        disabled={gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver}
      />
    </div>
  );
}
