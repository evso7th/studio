
// @ts-nocheck
"use client";

import type { useEffect } from 'react';
import { useRef, useCallback, useEffect as useReactEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent, EnemyComponent } from '@/components/game/GameRenderer';
import { LevelCompleteScreen } from '@/components/game/LevelCompleteScreen';
import { FinalScreen } from '@/components/game/FinalScreen';
import type { GameState } from '@/lib/gameTypes';
import { HERO_APPEARANCE_DURATION_MS, BACKGROUND_LEVEL1_SRC, BACKGROUND_LEVEL2_SRC, BACKGROUND_LEVEL3_SRC } from '@/lib/gameTypes';
import { Button } from "@/components/ui/button";
import { audioManager } from '@/lib/audioManager';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function PlayPage() {
  const { gameState, dispatch, gameTick } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

  const [parallaxBgX, setParallaxBgX] = useState(0);
  const initialHeroXRef = useRef<number | null>(null);
  const PARALLAX_FACTOR = 0.2;

  const [showDebugFinalScreen, setShowDebugFinalScreen] = useState(false);
  const [showDebugLevelComplete, setShowDebugLevelComplete] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isGamePausedForDialog, setIsGamePausedForDialog] = useState(false);


  useReactEffect(() => {
    // To debug final screen:
    // dispatch({ type: 'SET_DEBUG_LEVEL', payload: 3 }); 
    // setShowDebugFinalScreen(true);

    // To debug level complete screen:
    // dispatch({ type: 'SET_DEBUG_LEVEL_COMPLETE', payload: true });
    // setShowDebugLevelComplete(true); 
    // dispatch({ type: 'SET_DEBUG_LEVEL', payload: 1 }); 

    // To go to a specific level:
    // dispatch({ type: 'SET_DEBUG_LEVEL', payload: 1 }); 
  }, [dispatch]);


  const updateGameAreaSize = useCallback(() => {
    if (gameAreaRef.current) {
      const { clientWidth, clientHeight } = gameAreaRef.current;
      
      dispatch({ type: 'UPDATE_GAME_AREA', payload: { width: clientWidth, height: clientHeight, paddingTop: 0 } });
    }
  }, [dispatch]);

  useReactEffect(() => {
    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);
    
    // Attempt to lock screen orientation to portrait when the game page loads
    if (typeof screen.orientation?.lock === 'function') {
      screen.orientation.lock('portrait-primary')
        .then(() => console.log('Screen orientation locked to portrait.'))
        .catch((error) => console.warn('Screen orientation lock failed.', error));
    } else {
      console.warn('Screen Orientation API not supported or permission denied.');
    }

    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
      audioManager.stopAllSounds();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
       // Attempt to unlock orientation when leaving the game page
      if (typeof screen.orientation?.unlock === 'function') {
        screen.orientation.unlock();
      }
      // Fullscreen exit removed
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
        setTimeout(() => {
          if(gameState.currentLevel === parseInt(musicToPlay.replace('Level',''))) {
             audioManager.playSound(musicToPlay);
          }
        }, 500);
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


  const gameLoop = useCallback(() => {
    if (gameState.isGameInitialized && gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && !gameState.levelCompleteScreenActive && !gameState.gameOver && !gameState.gameLost && !isGamePausedForDialog) {
       gameTick();
    }
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameTick, gameState.isGameInitialized, gameState.gameArea.width, gameState.gameArea.height, gameState.levelCompleteScreenActive, gameState.gameOver, gameState.gameLost, isGamePausedForDialog]);

  useReactEffect(() => {
    if (!isGamePausedForDialog) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop, isGamePausedForDialog]);


  useReactEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showExitConfirmation || showDebugFinalScreen || gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver) return;

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
      if (showExitConfirmation || showDebugFinalScreen || gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver) return;
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
  }, [dispatch, gameState.heroAppearance, gameState.levelCompleteScreenActive, gameState.gameLost, gameState.gameOver, showDebugFinalScreen, showExitConfirmation]);

  useReactEffect(() => {
    const preventZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };
    
    document.body.style.touchAction = 'none'; 
    document.body.addEventListener('touchmove', preventZoom, { passive: false });

    // Removed user-agent check for Yandex Browser

    return () => {
      document.body.removeEventListener('touchmove', preventZoom);
      document.body.style.touchAction = ''; 
    };
  }, []);

  const handleOpenExitDialog = () => {
    setIsGamePausedForDialog(true);
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = async () => {
    audioManager.stopAllSounds(); 
    audioManager.playSound('exit'); 
    
    setShowExitConfirmation(false);
    setIsGamePausedForDialog(false);
    // Fullscreen exit removed

    setTimeout(() => {
      router.push('/'); 
    }, 300); 
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
    setIsGamePausedForDialog(false);
  };


  const getLevelBackground = (level: number): string => {
    switch (level) {
      case 1: return `url(${BACKGROUND_LEVEL1_SRC})`;
      case 2: return `url(${BACKGROUND_LEVEL2_SRC})`;
      case 3: return `url(${BACKGROUND_LEVEL3_SRC})`;
      default: return `url(${BACKGROUND_LEVEL1_SRC})`;
    }
  };

  const getBackgroundPosition = (level: number, pX: number): string => {
    let xOffset = pX;
    if (level === 2) { 
      xOffset = pX * 0.8; 
    } else if (level === 3) { 
      xOffset = pX * 1.2 + 200; 
    }
    return `calc(50% + ${xOffset}px) top`; 
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
            audioManager.stopAllSounds();
            dispatch({ type: 'RESTART_LEVEL' });
          }}
          size="lg"
          className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Начать сначала
        </Button>
         <Button
          onClick={handleConfirmExit} 
          variant="outline"
          size="lg"
          className="mt-4 text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Главное меню
        </Button>
      </div>
    );
  }

  if (gameState.levelCompleteScreenActive || showDebugLevelComplete) {
    return (
      <LevelCompleteScreen
        currentLevel={gameState.currentLevel}
        onNextLevel={() => {
          audioManager.stopAllSounds();
          dispatch({ type: 'NEXT_LEVEL' });
          if (showDebugLevelComplete) setShowDebugLevelComplete(false);
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
        paddingBottom: `env(safe-area-inset-bottom, 0px)`, // Removed extraBottomPadding calculation
        boxSizing: 'border-box',
      }}
      aria-label="Главное окно игры"
    >
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <div>
          <h1 className="text-xs font-normal text-white font-roboto shadow-md">IPO Mad Racing</h1>
          {gameState.hero?.isArmored && gameState.hero.armorRemainingTime > 0 && (
            <p className="text-xs font-normal text-accent font-roboto shadow-md">
              Броня: {gameState.hero.armorRemainingTime}с
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
            <p className="text-xs font-normal text-white font-roboto shadow-md">Level: {gameState.currentLevel}</p>
            <p className="text-xs font-normal text-white font-roboto shadow-md">Спасибки: {gameState.score}</p>
        </div>
      </header>

      <div
        ref={gameAreaRef}
        className="relative w-full overflow-hidden flex-grow" 
        style={{
          backgroundImage: getLevelBackground(gameState.currentLevel),
          backgroundSize: 'cover',
          backgroundPosition: getBackgroundPosition(gameState.currentLevel, parallaxBgX),
          backgroundRepeat: 'no-repeat',
          perspective: '1000px',
          height: '90vh', // Game area takes 90% of viewport height
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
      
      <AlertDialog open={showExitConfirmation} onOpenChange={(isOpen) => {
        if (!isOpen && isGamePausedForDialog) {
             handleCancelExit(); 
        } else if (isOpen && !showExitConfirmation) { 
            setShowExitConfirmation(true); 
            setIsGamePausedForDialog(true);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="relative w-24 h-24 mb-4">
              <Image 
                src="/assets/images/SimplyMan.png" 
                alt="Simply Man" 
                fill
                style={{ objectFit: 'contain' }}
                data-ai-hint="man thinking cartoon"
              />
            </div>
            <AlertDialogTitle>Вы действительно хотите покинуть игру?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-y-2.5">
            <Button variant="destructive" onClick={handleCancelExit} className="w-full sm:w-auto">Нет, остаться</Button>
            <Button variant="secondary" onClick={handleConfirmExit} className="w-full sm:w-auto">Да, покинуть</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full shrink-0" style={{ height: '10vh' }}> {/* Control panel takes 10% of viewport height */}
        <ControlPanel
          dispatch={dispatch}
          onExit={handleOpenExitDialog}
          disabled={gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver || showExitConfirmation}
          currentLevel={gameState.currentLevel}
        />
      </div>
    </div>
  );
}

