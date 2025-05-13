
// @ts-nocheck
"use client";

import type { Reducer} from 'react';
import { useRef, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic, getDefaultInitialGameState, gameReducer } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent, EnemyComponent } from '@/components/game/GameRenderer';
import { LevelCompleteScreen } from '@/components/game/LevelCompleteScreen';
import { FinalScreen } from '@/components/game/FinalScreen';
import type { GameState, GameAction } from '@/lib/gameTypes';
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

  const [showDebugFinalScreen, setShowDebugFinalScreen] = useState(false);
  const [showDebugLevelComplete, setShowDebugLevelComplete] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isGamePausedForDialog, setIsGamePausedForDialog] = useState(false);
  
  const [bottomPadding, setBottomPadding] = useState('0px');
  const [userAgentString, setUserAgentString] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserAgentString(navigator.userAgent);
    }
  }, []);

  useEffect(() => {
    let calculatedPadding = '0px'; // Default padding
    if (userAgentString) {
      const isYandexBrowser = /YaBrowser/i.test(userAgentString);
      if (isYandexBrowser) {
        calculatedPadding = '32px'; 
      }
    }
    setBottomPadding(calculatedPadding);
  }, [userAgentString]);


  const requestFullscreen = useCallback(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined' ) { 
      const element = document.documentElement as HTMLElement & {
        mozRequestFullScreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
        } else if (element.mozRequestFullScreen) { 
            element.mozRequestFullScreen().catch((err: any) => console.warn(`Error attempting to enable full-screen mode (Firefox): ${err.message} (${err.name})`));
        } else if (element.webkitRequestFullscreen) { 
            element.webkitRequestFullscreen().catch((err: any) => console.warn(`Error attempting to enable full-screen mode (WebKit): ${err.message} (${err.name})`));
        } else if (element.msRequestFullscreen) { 
            element.msRequestFullscreen().catch((err: any) => console.warn(`Error attempting to enable full-screen mode (IE/Edge): ${err.message} (${err.name})`));
        }
    }
  }, []);

  useEffect(() => {
    if (gameState.isGameInitialized) {
      requestFullscreen(); 
    }
  }, [gameState.isGameInitialized, requestFullscreen]);


  const updateGameAreaSize = useCallback(() => {
    if (gameAreaRef.current) {
      const { clientWidth, clientHeight } = gameAreaRef.current;
      const effectiveGameAreaHeight = clientHeight;

      dispatch({
        type: 'UPDATE_GAME_AREA',
        payload: { width: clientWidth, height: effectiveGameAreaHeight, paddingTop: 0 }
      });
    }
  }, [dispatch]);

  useEffect(() => {
    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);

    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
      audioManager.stopAllSounds();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateGameAreaSize]);

  useEffect(() => {
    if (gameState.isGameInitialized) {
      audioManager.stopAllSounds(); 
      audioManager.playSound('New_level'); 

      const levelMusicMap: Record<number, string> = {
        1: 'Level1',
        2: 'Level2',
        3: 'Level3',
      };
      const musicToPlay = levelMusicMap[gameState.currentLevel];

      if (musicToPlay) {
        const currentAudio = audioManager.getCurrentPlayingLoop();
        if (currentAudio !== musicToPlay) { 
          setTimeout(() => {
             if (gameState.isGameInitialized && gameState.currentLevel === parseInt(musicToPlay.replace('Level',''))) {
              audioManager.playSound(musicToPlay);
            }
          }, 500); 
        }
      }
    }
  }, [gameState.currentLevel, gameState.isGameInitialized]);

  useEffect(() => {
    if (gameState.isGameInitialized && gameState.activeCoins.length > 0 && gameState.currentPairIndex === 0) {
      const firstPairExistsAndSpawning = gameState.activeCoins.some(c => c.pairId === 0 && c.isSpawning);
      if (firstPairExistsAndSpawning) {
        // audioManager.playSound('Coin_splash'); // Sound handled in reducer
      }
    }
  }, [gameState.isGameInitialized, gameState.activeCoins, gameState.currentPairIndex]);


  const gameLoop = useCallback(() => {
    if (gameState.isGameInitialized && gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && !gameState.levelCompleteScreenActive && !gameState.gameOver && !gameState.gameLost && !isGamePausedForDialog) {
       gameTick();
    }
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameTick, gameState.isGameInitialized, gameState.gameArea.width, gameState.gameArea.height, gameState.levelCompleteScreenActive, gameState.gameOver, gameState.gameLost, isGamePausedForDialog]);

  useEffect(() => {
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


  useEffect(() => {
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


  const handleOpenExitDialog = () => {
    setIsGamePausedForDialog(true); 
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = async () => {
    audioManager.stopAllSounds();
    audioManager.playSound('exit');

    setShowExitConfirmation(false);
    setIsGamePausedForDialog(false); 
    
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
      case 1: return BACKGROUND_LEVEL1_SRC;
      case 2: return BACKGROUND_LEVEL2_SRC;
      case 3: return BACKGROUND_LEVEL3_SRC;
      default: return BACKGROUND_LEVEL1_SRC;
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
        paddingBottom: bottomPadding, 
        boxSizing: 'border-box',
      }}
      aria-label="Главное окно игры"
    >
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <div>
          <h1 className="font-roboto text-2xl font-bold text-white shadow-md">IPO Mad Racing</h1>
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
        className="relative w-full overflow-hidden flex-grow bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${getLevelBackground(gameState.currentLevel)})`,
          backgroundSize: 'cover', 
          backgroundPosition: gameState.currentLevel === 3 ? 'top right' : 'top center',
          height: `calc(100% - 10vh - ${bottomPadding})`, 
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
            <div 
              className="relative w-24 h-24 mb-4 bg-contain bg-no-repeat bg-center"
              style={{
                backgroundImage: 'url(/assets/images/SimplyMan.png)',
              }}
              role="img"
              aria-label="Simply Man"
              data-ai-hint="man thinking cartoon"
            />
            <AlertDialogTitle>Вы действительно хотите покинуть игру?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-y-2.5">
            <Button variant="destructive" onClick={handleCancelExit} className="w-full sm:w-auto">Нет, остаться</Button>
            <Button variant="secondary" onClick={handleConfirmExit} className="w-full sm:w-auto">Да, покинуть</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full shrink-0" style={{ height: '10vh' }}> 
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
