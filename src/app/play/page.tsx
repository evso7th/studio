"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent } from '@/components/game/GameRenderer';
import type { GameState } from '@/lib/gameTypes'; // Ensure GameState is exported from gameTypes

const GameScreen = () => {
  const { gameState, dispatch, gameTick } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

  const updateGameAreaSize = useCallback(() => {
    if (gameAreaRef.current) {
      const { offsetWidth, offsetHeight } = gameAreaRef.current;
      // Subtract control panel height if it's part of the gameAreaRef measured height
      // For this layout, gameAreaRef should exclude the control panel.
      dispatch({ type: 'UPDATE_GAME_AREA', payload: { width: offsetWidth, height: offsetHeight } });
    }
  }, [dispatch]);

  useEffect(() => {
    updateGameAreaSize(); // Initial size update
    window.addEventListener('resize', updateGameAreaSize);
    return () => window.removeEventListener('resize', updateGameAreaSize);
  }, [updateGameAreaSize]);

  useEffect(() => {
    const loop = () => {
      if (gameState.gameArea.width > 0 && gameState.gameArea.height > 0) {
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
  }, [gameTick, gameState.gameArea]);
  
  const handleExit = () => {
    router.push('/');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[hsl(var(--game-bg))] select-none">
      {/* Game Info Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <h1 className="text-2xl font-bold text-white font-roboto shadow-md">IPO Mad Racing</h1>
        <div className="flex flex-col items-end">
            <p className="text-lg font-bold text-white font-roboto shadow-md">Level: {gameState.currentLevel}</p>
            <p className="text-lg font-bold text-white font-roboto shadow-md">Spasibki: {gameState.score}</p>
        </div>
      </header>
      
      {/* Game Area where elements are rendered */}
      {/* Subtract control panel height (h-20 = 5rem = 80px) and header padding from available height */}
      <div ref={gameAreaRef} className="flex-grow relative w-full overflow-hidden pt-16 pb-20"> {/* pt for header, pb for control panel */}
        {gameState.gameArea.height > 0 && (
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
