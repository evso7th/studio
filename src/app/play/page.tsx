
// @ts-nocheck
"use client";

import type { Reducer} from 'react';
import { useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultInitialGameState, gameReducer, calculatePlatformGroundY } from '@/hooks/useGameLogic';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HeroComponent, PlatformComponent, CoinComponent, EnemyComponent } from '@/components/game/GameRenderer';
import { LevelCompleteScreen } from '@/components/game/LevelCompleteScreen';
import { FinalScreen } from '@/components/game/FinalScreen';
import type { GameState, GameAction } from '@/lib/gameTypes';
import { 
    HERO_APPEARANCE_DURATION_MS, 
    BACKGROUND_LEVEL1_SRC, 
    BACKGROUND_LEVEL2_SRC, 
    BACKGROUND_LEVEL3_SRC, 
    CONTROL_PANEL_HEIGHT_PX,
    MARQUEE_HEIGHT_PX,
    SAFE_AREA_BOTTOM_PADDING,
    YANDEX_BROWSER_BOTTOM_OFFSET,
    PLATFORM_GROUND_THICKNESS,
    GROUND_FLOOR_SRC
} from '@/lib/gameTypes';
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
  const initialGameStateForReducer = getDefaultInitialGameState(800, 600, 1);
  const [gameState, dispatch] = useReducer<Reducer<GameState, GameAction>>(gameReducer, initialGameStateForReducer);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const router = useRouter();

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isGamePausedForDialog, setIsGamePausedForDialog] = useState(false);
  
  const [gameDimensions, setGameDimensions] = useState({ width: 0, height: 0 });
  
  const [effectiveBottomPadding, setEffectiveBottomPadding] = useState(SAFE_AREA_BOTTOM_PADDING);
  const [controlPanelHeight, setControlPanelHeight] = useState(CONTROL_PANEL_HEIGHT_PX); 
  const [totalPageHeight, setTotalPageHeight] = useState(0);


  useEffect(() => {
    // This effect now only runs once on mount to set the initial total page height
    // and potentially other one-time setup.
    const updateTotalPageHeight = () => {
      if (typeof window !== 'undefined') {
        setTotalPageHeight(window.innerHeight);
      }
    };
    updateTotalPageHeight(); // Initial call
  
    // No need to add window resize listener here if it's handled by ResizeObserver
  }, []);


  useEffect(() => {
    const updateLayout = () => {
      if (containerRef.current && gameAreaRef.current && totalPageHeight > 0) {
        
        const newControlPanelHeight = totalPageHeight * 0.10; // 10% of total height
        setControlPanelHeight(newControlPanelHeight);
        
        const newGameAreaHeight = totalPageHeight * 0.90 - MARQUEE_HEIGHT_PX; // 90% of total height minus marquee

        setGameDimensions({
          width: gameAreaRef.current.clientWidth, 
          height: newGameAreaHeight,
        });
      }
    };

    updateLayout(); 

    // Using ResizeObserver for containerRef if its size can change dynamically
    // independent of window resize (e.g., sidebar animations, etc.)
    const resizeObserver = new ResizeObserver(updateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Still useful to listen to window resize for overall page changes
    window.addEventListener('resize', updateLayout);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateLayout);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      audioManager.stopAllSounds();
    };
  }, [totalPageHeight]); // Depend on totalPageHeight to recalculate layout


  useEffect(() => {
    if (gameDimensions.width > 0 && gameDimensions.height > 0) {
      const groundY = calculatePlatformGroundY(gameDimensions.height);
      const platformGround = {
        id: 'platform_ground',
        x: -100,
        y: groundY,
        width: gameDimensions.width + 200,
        height: PLATFORM_GROUND_THICKNESS,
        isMoving: false,
        speed: 0,
        direction: 1,
        moveAxis: 'x',
        imageSrc: GROUND_FLOOR_SRC, 
      };
      
      dispatch({
        type: 'UPDATE_GAME_AREA',
        payload: {
          width: gameDimensions.width,
          height: gameDimensions.height,
          paddingTop: 0, 
        },
      });
    }
  }, [gameDimensions, dispatch, gameState.currentLevel]);


  useEffect(() => {
    if (gameState.isGameInitialized) {
      audioManager.stopAllSounds(); 
      
      if (gameState.soundToPlay !== 'New_level') { 
        dispatch({ type: 'SOUND_PLAYED' }); 
        dispatch({ type: 'GAME_TICK', payload: { deltaTime: 0 } }); 
      }


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
             if(gameState.isGameInitialized && gameState.currentLevel === parseInt(musicToPlay.replace('Level',''))) {
              audioManager.playSound(musicToPlay);
            }
          }, 500); 
        }
      }
    }
  }, [gameState.currentLevel, gameState.isGameInitialized, dispatch]);

  useEffect(() => {
    if (gameState.soundToPlay) {
      audioManager.playSound(gameState.soundToPlay);
      dispatch({ type: 'SOUND_PLAYED' });
    }
  }, [gameState.soundToPlay, dispatch]);

  useEffect(() => {
    if (gameState.isGameInitialized && gameState.activeCoins.length > 0 && gameState.currentPairIndex === 0) {
      const firstPairExistsAndSpawning = gameState.activeCoins.some(c => c.pairId === 0 && c.isSpawning);
    }
  }, [gameState.isGameInitialized, gameState.activeCoins, gameState.currentPairIndex]);


  const gameLoop = useCallback(() => { 
    if (gameState.isGameInitialized && gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && !gameState.levelCompleteScreenActive && !gameState.gameOver && !gameState.gameLost && !isGamePausedForDialog) {
       dispatch({ type: 'GAME_TICK', payload: { deltaTime: 1000 / 60 } }); 
    }
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [dispatch, gameState.isGameInitialized, gameState.gameArea.width, gameState.gameArea.height, gameState.levelCompleteScreenActive, gameState.gameOver, gameState.gameLost, isGamePausedForDialog]);

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
      if (showExitConfirmation || gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver) return;

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
      if (showExitConfirmation || gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver) return;
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
  }, [dispatch, gameState.heroAppearance, gameState.levelCompleteScreenActive, gameState.gameLost, gameState.gameOver, showExitConfirmation]);


  const handleOpenExitDialog = () => {
    setIsGamePausedForDialog(true); 
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = async () => {
    dispatch({ type: 'EXIT_GAME' }); 
    
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


  if (gameState.gameLost) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h2 className="text-4xl font-bold mb-4 text-destructive">Игра окончена!</h2>
        <p className="text-xl mb-8 text-center">Кажется, наш герой немного увлекся полетом...</p>
        <Button
          onClick={() => {
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

  if (gameState.levelCompleteScreenActive || gameState.showDebugLevelComplete) {
    return (
      <LevelCompleteScreen
        currentLevel={gameState.currentLevel}
        onNextLevel={() => {
          dispatch({ type: 'NEXT_LEVEL' });
          if (gameState.showDebugLevelComplete) dispatch({type: 'SET_DEBUG_LEVEL_COMPLETE', payload: false });
        }}
      />
    );
  }

  if (gameState.gameOver && gameState.currentLevel === 3 && !gameState.gameLost) {
     return <FinalScreen />;
  }


  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: 'hsl(var(--background))',
        // paddingBottom: `${effectiveBottomPadding}px`, // Removed fixed padding
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
        className="relative w-full overflow-hidden flex-grow"
        style={{
          backgroundImage: `url(${getLevelBackground(gameState.currentLevel)})`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center center',
        }}
        data-ai-hint="abstract pattern"
      >
        {gameState.isGameInitialized && gameDimensions.height > 0 && gameState.hero && (
          <>
            <HeroComponent
              hero={gameState.hero}
              gameAreaHeight={gameDimensions.height}
              paddingTop={0} 
              heroAppearance={gameState.heroAppearance}
              heroAppearElapsedTime={gameState.heroAppearElapsedTime}
              heroAppearanceDuration={HERO_APPEARANCE_DURATION_MS}
            />
            {gameState.platforms.map(platform => (
              <PlatformComponent key={platform.id} platform={platform} gameAreaHeight={gameDimensions.height} paddingTop={0} />
            ))}
            {gameState.activeCoins.map(coin => (
              <CoinComponent key={coin.id} coin={coin} gameAreaHeight={gameDimensions.height} paddingTop={0} />
            ))}
            {gameState.enemies.map(enemy => (
              <EnemyComponent key={enemy.id} enemy={enemy} gameAreaHeight={gameDimensions.height} paddingTop={0} />
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

      <div className="w-full shrink-0" style={{ height: `${controlPanelHeight}px` }}>  
        <ControlPanel
          dispatch={dispatch}
          onExit={handleOpenExitDialog}
          disabled={gameState.heroAppearance === 'appearing' || gameState.levelCompleteScreenActive || gameState.gameLost || gameState.gameOver || showExitConfirmation}
          currentLevel={gameState.currentLevel}
        />
      </div>
       <div 
        className="w-full shrink-0 flex items-center overflow-hidden bg-black text-white"
        style={{ height: `${MARQUEE_HEIGHT_PX}px` }}
      >
        <p className="marquee-text whitespace-nowrap text-sm">
          В знак уважения и восхищения наш скромный подарок в честь Вашего Дня рождения. С самыми добрыми пожеланиями Наталья, Евгений и Сергей
        </p>
      </div>
    </div>
  );
}
