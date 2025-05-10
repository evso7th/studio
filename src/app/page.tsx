
// @ts-nocheck
"use client";

import type { useEffect } from 'react';
import { useRef, useCallback, useEffect as useReactEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent } from '@/components/game/GameRenderer';
import { LevelCompleteScreen } from '@/components/game/LevelCompleteScreen';
import type { GameState } from '@/lib/gameTypes'; 
import { HERO_APPEARANCE_DURATION_MS } from '@/lib/gameTypes';
import { Button } from "@/components/ui/button";


export default function HomePage() {
  const { gameState, dispatch, gameTick } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

  const [parallaxBgX, setParallaxBgX] = useState(0);
  const initialHeroXRef = useRef<number | null>(null);
  const PARALLAX_FACTOR = 0.2; 

  // TEMPORARY: For debugging - start with level complete screen active
  // useReactEffect(() => {
  //   if (dispatch) { // Ensure dispatch is available
  //     dispatch({ type: 'SET_DEBUG_LEVEL_COMPLETE', payload: true });
  //   }
  // }, [dispatch]);


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
    return () => window.removeEventListener('resize', updateGameAreaSize);
  }, [updateGameAreaSize]);

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
      if (gameState.isGameInitialized && gameState.gameArea.width > 0 && gameState.gameArea.height > 0) {
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
  }, [gameTick, gameState.isGameInitialized, gameState.gameArea.width, gameState.gameArea.height]); 

  useReactEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost) return; 

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
      if (gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost) return; 
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
  }, [dispatch, gameState.heroAppearance, gameState.levelCompleteScreenActive, gameState.gameLost]); 
  
  const handleExit = () => {
    dispatch({ type: 'RESTART_LEVEL' });
  };

  if (gameState.gameLost) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h2 className="text-4xl font-bold mb-4 text-destructive">Игра окончена!</h2>
        <p className="text-xl mb-8 text-center">Кажется, наш герой немного увлекся полетом...</p>
        <Button 
          onClick={() => dispatch({ type: 'RESTART_LEVEL' })} 
          size="lg"
          className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Начать сначала
        </Button>
      </div>
    );
  }

  if (gameState.levelCompleteScreenActive) {
    return (
      <LevelCompleteScreen
        currentLevel={gameState.currentLevel}
        onNextLevel={() => dispatch({ type: 'NEXT_LEVEL' })}
      />
    );
  }

  return (
    <div 
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{ 
        backgroundColor: 'hsl(var(--background))', 
      }}
      aria-label="IPO Mad Racing Game Screen"
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
          backgroundPosition: `${parallaxBgX - 100}px center`, 
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
          </>
        )}
      </div>

      <ControlPanel 
        dispatch={dispatch} 
        onExit={handleExit} 
        disabled={gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost} 
      />
    </div>
  );
}

