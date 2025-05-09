
// @ts-nocheck
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent } from '@/components/game/GameRenderer';
import type { GameState } from '@/lib/gameTypes'; 
import { HERO_APPEARANCE_DURATION_MS } from '@/lib/gameTypes';

const GameScreen = () => {
  const { gameState, dispatch, gameTick } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

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

  useEffect(() => {
    updateGameAreaSize(); 
    window.addEventListener('resize', updateGameAreaSize);
    return () => window.removeEventListener('resize', updateGameAreaSize);
  }, [updateGameAreaSize]);

  useEffect(() => {
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.heroAppearance === 'appearing') return; 

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
      if (gameState.heroAppearance === 'appearing') return; 
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
  }, [dispatch, gameState.heroAppearance]); 
  
  const handleExit = () => {
    router.push('/');
  };

  useEffect(() => {
    if (gameState.gameOver) { // gameOver is true when level is completed
      // Optionally, add a delay or a "Level Complete" message before navigating
      router.push('/');
    }
  }, [gameState.gameOver, router]);

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
          backgroundImage: 'url("https://neurostaffing.online/wp-content/uploads/2025/05/BackGroundBase.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center left', 
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'hsl(var(--game-bg))', 
        }}
        data-ai-hint="abstract pattern"
      >
        {gameState.isGameInitialized && gameState.gameArea.height > 0 && (
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

      <ControlPanel dispatch={dispatch} onExit={handleExit} disabled={gameState.heroAppearance === 'appearing'} />
    </div>
  );
};

export default GameScreen;
