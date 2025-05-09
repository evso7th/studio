// @ts-nocheck
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent } from '@/components/game/GameRenderer';
import type { GameState } from '@/lib/gameTypes'; 

const GameScreen = () => {
  const { gameState, dispatch, gameTick } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

  const updateGameAreaSize = useCallback(() => {
    if (gameAreaRef.current) {
      const { offsetWidth, offsetHeight } = gameAreaRef.current;
      dispatch({ type: 'UPDATE_GAME_AREA', payload: { width: offsetWidth, height: offsetHeight } });
    }
  }, [dispatch]);

  useEffect(() => {
    updateGameAreaSize(); 
    window.addEventListener('resize', updateGameAreaSize);
    return () => window.removeEventListener('resize', updateGameAreaSize);
  }, [updateGameAreaSize]);

  useEffect(() => {
    const loop = () => {
      // Ensure gameArea is initialized before starting game ticks
      if (gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && gameState.isGameInitialized) {
         gameTick(gameState.gameArea);
      }
      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameTick, gameState.gameArea, gameState.isGameInitialized]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Standard browser functions we don't want to impede
      if (event.key === 'F5' || (event.ctrlKey && event.key.toLowerCase() === 'r')) return;
      if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') || 
          (event.metaKey && event.altKey && event.key.toLowerCase() === 'i') || // macOS dev tools
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
        case ' ': // Space bar
          dispatch({ type: 'JUMP' });
          handled = true;
          break;
      }
      if (handled) {
          event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
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
      // Stop movement when navigating away or component unmounts
      dispatch({ type: 'MOVE_LEFT_STOP' });
      dispatch({ type: 'MOVE_RIGHT_STOP' });
    };
  }, [dispatch]);
  
  const handleExit = () => {
    router.push('/');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[hsl(var(--game-bg))] select-none">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <h1 className="text-2xl font-bold text-white font-roboto shadow-md">IPO Mad Racing</h1>
        <div className="flex flex-col items-end">
            <p className="text-lg font-bold text-white font-roboto shadow-md">Level: {gameState.currentLevel}</p>
            <p className="text-lg font-bold text-white font-roboto shadow-md">Спасибки: {gameState.score}</p>
        </div>
      </header>
      
      <div ref={gameAreaRef} className="flex-grow relative w-full overflow-hidden pt-16 pb-20">
        {gameState.isGameInitialized && gameState.gameArea.height > 0 && (
          <>
            <HeroComponent hero={gameState.hero} gameAreaHeight={gameState.gameArea.height} />
            {gameState.platforms.map(platform => (
              <PlatformComponent key={platform.id} platform={platform} gameAreaHeight={gameState.gameArea.height} />
            ))}
            {gameState.coins.map(coin => (
              <CoinComponent key={coin.id} coin={coin} gameAreaHeight={gameState.gameArea.height} />
            ))}
          </>
        )}
      </div>

      <ControlPanel dispatch={dispatch} onExit={handleExit} />
    </div>
  );
};

export default GameScreen;

