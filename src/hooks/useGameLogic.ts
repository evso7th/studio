
// @ts-nocheck
"use client";

import type { Reducer} from 'react';
import { useReducer, useCallback, useEffect, useRef } from 'react'; 
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position, HeroAnimations } from '@/lib/gameTypes'; 
import { 
    HERO_APPEARANCE_DURATION_MS, 
    PLATFORM_GROUND_Y_FROM_BOTTOM, 
    PLATFORM_GROUND_THICKNESS, 
    HERO_WIDTH,
    HERO_HEIGHT, 
    COIN_SIZE,
    PLATFORM_NON_GROUND_HEIGHT,
    PLATFORM_DEFAULT_WIDTH,
    TARGET_JUMP_HEIGHT_PX,
    PLATFORM1_Y_OFFSET,
    PLATFORM2_Y_OFFSET,
    INITIAL_PLATFORM1_X_PERCENT,
    INITIAL_PLATFORM_SPEED, 
    INITIAL_PLATFORM2_X_PERCENT,
    COIN_EXPLOSION_DURATION_MS,
    TOTAL_COINS_PER_LEVEL,
    COIN_SPAWN_EXPLOSION_DURATION_MS,
    MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR,
    MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR,
    COIN_ZONE_TOP_OFFSET,
    COIN_SPAWN_DELAY_MS,
    HERO_BASE_SPEED,
    heroAnimationsConfig,
} from '@/lib/gameTypes'; 

const GRAVITY_ACCELERATION = 0.4; 
const MAX_FALL_SPEED = -8; 


const JUMP_STRENGTH = (-GRAVITY_ACCELERATION + Math.sqrt(GRAVITY_ACCELERATION * GRAVITY_ACCELERATION + 8 * GRAVITY_ACCELERATION * TARGET_JUMP_HEIGHT_PX)) / 2;

const calculatePlatformGroundY = (gameAreaHeight: number) => {
  return PLATFORM_GROUND_Y_FROM_BOTTOM; 
};

const initialHeroState: HeroType = {
  id: 'hero',
  x: 0, 
  y: 0, 
  width: HERO_WIDTH,
  height: HERO_HEIGHT, 
  velocity: { x: 0, y: 0 },
  action: 'idle',
  isOnPlatform: true, 
  platformId: 'platform_ground', 
  currentSpeedX: 0,
  facingDirection: 'right',
  animations: heroAnimationsConfig,
  currentFrame: 0,
  frameTime: 0,
};

const getLevelPlatforms = (gameAreaWidth: number, gameAreaHeight: number, level: number): PlatformType[] => {
  const groundPlatformY = calculatePlatformGroundY(gameAreaHeight);

  return [
    {
      id: 'platform_ground', x: -100, y: groundPlatformY, 
      width: gameAreaWidth + 200, height: PLATFORM_GROUND_THICKNESS, 
      isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
      imageSrc: "https://neurostaffing.online/wp-content/uploads/2025/05/GroundFloor.png",
    },
    {
      id: 'platform1', 
      x: gameAreaWidth * INITIAL_PLATFORM1_X_PERCENT - PLATFORM_DEFAULT_WIDTH, // Start from right edge
      y: groundPlatformY + PLATFORM_GROUND_THICKNESS + PLATFORM1_Y_OFFSET, 
      width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT, 
      isMoving: true, speed: INITIAL_PLATFORM_SPEED, direction: 1, moveAxis: 'x',
      moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH },
      imageSrc: "https://neurostaffing.online/wp-content/uploads/2025/05/PlatformGrassShort.png",
    },
    {
      id: 'platform2', 
      x: gameAreaWidth * INITIAL_PLATFORM2_X_PERCENT, // Start from left edge
      y: groundPlatformY + PLATFORM_GROUND_THICKNESS + PLATFORM2_Y_OFFSET, 
      width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT,
      isMoving: true, speed: INITIAL_PLATFORM_SPEED, direction: -1, moveAxis: 'x',
      moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH },
      imageSrc: "https://neurostaffing.online/wp-content/uploads/2025/05/PlatformGrassShort.png",
    },
  ];
};


function spawnNextCoinPair(gameArea: Size, coinSize: number, currentPairId: number, platforms: PlatformType[]): CoinType[] {
  if (!gameArea.width || !gameArea.height || platforms.length < 3) return []; 
  const newPair: CoinType[] = [];
  
  const groundPlatformY = calculatePlatformGroundY(gameArea.height);
  const platform1 = platforms.find(p => p.id === 'platform1');
  const platform1TopActualY = platform1 ? platform1.y + platform1.height : groundPlatformY + PLATFORM_GROUND_THICKNESS + PLATFORM1_Y_OFFSET + PLATFORM_NON_GROUND_HEIGHT;

  const coinSpawnZoneCeilingY = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize;
  const coinSpawnZoneFloorY = platform1TopActualY;


  let effectiveMinSpawnY = Math.max(groundPlatformY + PLATFORM_GROUND_THICKNESS, coinSpawnZoneFloorY);
  let effectiveMaxSpawnY = coinSpawnZoneCeilingY;

  if (effectiveMinSpawnY >= effectiveMaxSpawnY) {
    effectiveMinSpawnY = Math.max(groundPlatformY + PLATFORM_GROUND_THICKNESS + 1, platform1TopActualY + 1);
    effectiveMaxSpawnY = effectiveMinSpawnY; 
    if (effectiveMinSpawnY + coinSize > gameArea.height -1) { 
        effectiveMinSpawnY = gameArea.height - coinSize - 1;
        effectiveMaxSpawnY = effectiveMinSpawnY;
    }
  }
  
  const yRandomFactorRange = effectiveMaxSpawnY - effectiveMinSpawnY;
  const minDistanceX = gameArea.width * MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR;
  const minDistanceY = Math.max(20, gameArea.height * MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR); 

  const x1 = Math.random() * (gameArea.width - coinSize);
  const y1 = effectiveMinSpawnY + (yRandomFactorRange > 0 ? (Math.random() * yRandomFactorRange) : 0);
  newPair.push({
    id: `coin_p${currentPairId}_0_${Date.now()}`,
    x: x1, y: y1, width: coinSize, height: coinSize,
    color: 'hsl(var(--coin-color))', collected: false, isExploding: false, explosionProgress: 0,
    isSpawning: true, 
    spawnExplosionProgress: 0,
    pairId: currentPairId,
    isPendingSpawn: false, 
    spawnDelayMs: 0,
  });

  let x2, y2;
  let attempts = 0;
  const maxAttempts = 20;
  do {
    x2 = Math.random() * (gameArea.width - coinSize);
    y2 = effectiveMinSpawnY + (yRandomFactorRange > 0 ? (Math.random() * yRandomFactorRange) : 0);
    attempts++;
  } while ( (Math.abs(x2 - x1) < minDistanceX || Math.abs(y2 - y1) < minDistanceY) && attempts < maxAttempts); 
  
  newPair.push({
    id: `coin_p${currentPairId}_1_${Date.now()}`,
    x: x2, y: y2, width: coinSize, height: coinSize,
    color: 'hsl(var(--coin-color))', collected: false, isExploding: false, explosionProgress: 0,
    isSpawning: false, 
    spawnExplosionProgress: 0, 
    pairId: currentPairId,
    isPendingSpawn: true,
    spawnDelayMs: COIN_SPAWN_DELAY_MS,
  });

  return newPair;
}


const getDefaultInitialGameState = (gameAreaWidth = 800, gameAreaHeight = 600, level = 1): GameState => {
  const groundPlatformY = calculatePlatformGroundY(gameAreaHeight);
  const platforms = getLevelPlatforms(gameAreaWidth, gameAreaHeight, level);
  return {
    hero: {
      ...initialHeroState,
      x: gameAreaWidth / 2 - initialHeroState.width / 2,
      y: groundPlatformY + PLATFORM_GROUND_THICKNESS,
    },
    platforms: platforms,
    activeCoins: spawnNextCoinPair({ width: gameAreaWidth, height: gameAreaHeight }, COIN_SIZE, 0, platforms),
    score: 0,
    currentLevel: level,
    gameOver: false,
    gameLost: false,
    gameArea: { width: gameAreaWidth, height: gameAreaHeight },
    isGameInitialized: false, 
    paddingTop: 0,
    heroAppearance: 'appearing',
    heroAppearElapsedTime: 0,
    totalCoinsCollectedInLevel: 0,
    currentPairIndex: 0,
    levelCompleteScreenActive: false,
  };
};

const initialGameState = getDefaultInitialGameState();


function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_LEFT_START':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost) {
        return { ...state, hero: { ...state.hero, currentSpeedX: -HERO_BASE_SPEED, action: 'run_left', facingDirection: 'left' } };
      }
      return state;
    case 'MOVE_LEFT_STOP':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost) {
        return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX < 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
      }
      return state;
    case 'MOVE_RIGHT_START':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost) {
        return { ...state, hero: { ...state.hero, currentSpeedX: HERO_BASE_SPEED, action: 'run_right', facingDirection: 'right' } };
      }
      return state;
    case 'MOVE_RIGHT_STOP':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost) {
        return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX > 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
      }
      return state;
    case 'JUMP':
      if (state.heroAppearance === 'visible' && state.hero.isOnPlatform && !state.levelCompleteScreenActive && !state.gameLost) {
        return { ...state, hero: { ...state.hero, velocity: { ...state.hero.velocity!, y: JUMP_STRENGTH }, isOnPlatform: false, platformId: null, action: 'jump_up' } };
      }
      return state;
    case 'UPDATE_GAME_AREA': {
      const { width, height, paddingTop } = action.payload;
      if (width <= 0 || height <= 0) return state; 

      const newState = getDefaultInitialGameState(width, height, state.currentLevel);
      return {
        ...newState,
        paddingTop,
        isGameInitialized: true, 
      };
    }
     case 'RESTART_LEVEL': {
      const { width, height } = state.gameArea;
      const newState = getDefaultInitialGameState(width, height, state.currentLevel); // Restart current level
      return {
        ...newState,
        isGameInitialized: true,
        paddingTop: state.paddingTop,
      };
    }
    case 'NEXT_LEVEL': {
      const nextLevel = state.currentLevel + 1;
      const { width, height } = state.gameArea;
      const newState = getDefaultInitialGameState(width, height, nextLevel);
      return {
        ...newState,
        isGameInitialized: true,
        paddingTop: state.paddingTop,
      };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized || state.levelCompleteScreenActive || state.gameLost) return state;
      const { deltaTime } = action.payload;

      let { hero: heroState, platforms: currentPlatforms, activeCoins: currentActiveCoins, score: currentScore, totalCoinsCollectedInLevel: currentTotalCollected, currentPairIndex: currentPairIdx } = state;
      const gameArea = state.gameArea;
      let nextHeroAppearance = state.heroAppearance;
      let nextHeroAppearElapsedTime = state.heroAppearElapsedTime;

      let nextPlatforms = currentPlatforms.map(p => ({ ...p }));
      let nextHero = { ...heroState, velocity: { ...heroState.velocity }, animations: { ...heroState.animations} }; 
      let nextActiveCoins = currentActiveCoins.map(c => ({ ...c }));
      let nextScore = currentScore;
      let nextTotalCollected = currentTotalCollected;
      let nextPairIdx = currentPairIdx;
      let levelComplete = false; 
      let gameLostThisTick = false;

      const currentAnimationKey = nextHero.action === 'run_left' || nextHero.action === 'run_right' ? 'run' : (nextHero.action === 'jump_up' || nextHero.action === 'fall_down' ? 'jump' : 'idle');
      const currentAnimation = nextHero.animations[currentAnimationKey];
      
      nextHero.frameTime += deltaTime;
      if (currentAnimation && nextHero.frameTime >= 1000 / currentAnimation.fps) {
        nextHero.frameTime = 0;
        nextHero.currentFrame = (nextHero.currentFrame + 1) % currentAnimation.frames;
      }


      nextActiveCoins = nextActiveCoins.map(coin => {
        if (coin.isPendingSpawn && coin.spawnDelayMs !== undefined) {
          const newDelay = coin.spawnDelayMs - deltaTime;
          if (newDelay <= 0) {
            return {
              ...coin,
              isPendingSpawn: false,
              spawnDelayMs: 0,
              isSpawning: true, 
              spawnExplosionProgress: 0,
            };
          }
          return { ...coin, spawnDelayMs: newDelay };
        }
        return coin;
      });

      nextActiveCoins = nextActiveCoins.map(coin => {
        if (coin.isSpawning) {
          const newProgress = (coin.spawnExplosionProgress || 0) + (deltaTime / COIN_SPAWN_EXPLOSION_DURATION_MS);
          if (newProgress >= 1) {
            return { ...coin, isSpawning: false, spawnExplosionProgress: 1 };
          }
          return { ...coin, spawnExplosionProgress: newProgress };
        }
        return coin;
      });
      
      nextActiveCoins = nextActiveCoins.map(coin => {
        if (coin.isExploding && coin.collected) {
          const newProgress = (coin.explosionProgress || 0) + (deltaTime / COIN_EXPLOSION_DURATION_MS);
          if (newProgress >= 1) {
            return { ...coin, isExploding: false, explosionProgress: 1 }; 
          }
          return { ...coin, explosionProgress: newProgress };
        }
        return coin;
      });

      const groundPlatformY = calculatePlatformGroundY(gameArea.height);
      nextPlatforms = nextPlatforms.map(p => {
        if (p.id === 'platform_ground') {
             return {...p, y: groundPlatformY};
        }
        if (p.isMoving && p.id !== 'platform_ground') {
          let platformNewX = p.x;
          let platformVelX = p.speed * p.direction;
          if (p.moveAxis === 'x' && p.moveRange) {
            platformNewX += platformVelX * (deltaTime / (1000/60)); 
            if (platformNewX <= p.moveRange.min || platformNewX + p.width >= p.moveRange.max + p.width ) { 
               p.direction *= -1; 
               platformVelX *= -1; 
               platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max));
            }
          }
           const platformNewY = groundPlatformY + PLATFORM_GROUND_THICKNESS + (p.id === 'platform1' ? PLATFORM1_Y_OFFSET : PLATFORM2_Y_OFFSET);
          return { ...p, x: platformNewX, y: platformNewY, velocity: { x: platformVelX, y: 0 } };
        }
        return { ...p, velocity: {x: 0, y: 0}}; 
      });

      if (state.heroAppearance === 'appearing') {
        nextHeroAppearElapsedTime += deltaTime; 
        if (nextHeroAppearElapsedTime >= HERO_APPEARANCE_DURATION_MS) {
          nextHeroAppearance = 'visible';
          nextHeroAppearElapsedTime = HERO_APPEARANCE_DURATION_MS;
          nextHero.action = 'idle'; 
        }
        nextHero.velocity = { x: 0, y: 0 };
        nextHero.currentSpeedX = 0;
        nextHero.facingDirection = heroState.facingDirection || 'right';
      } else { 
        let newVelY = (nextHero.velocity?.y ?? 0) - GRAVITY_ACCELERATION * (deltaTime / (1000/60));
        newVelY = Math.max(newVelY, MAX_FALL_SPEED);

        let platformMovementEffectX = 0;
        if (nextHero.isOnPlatform && nextHero.platformId) {
          const currentPlatformInstance = nextPlatforms.find(p => p.id === nextHero.platformId);
          if (currentPlatformInstance?.isMoving && currentPlatformInstance.velocity?.x) {
            platformMovementEffectX = currentPlatformInstance.velocity.x * (deltaTime / (1000/60));
          }
        }
        
        let newPosX = nextHero.x + nextHero.currentSpeedX * (deltaTime / (1000/60)) + platformMovementEffectX;
        let newPosY = nextHero.y + newVelY * (deltaTime / (1000/60));
        
        if (newVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down'; 
        else if (newVelY > 0) nextHero.action = 'jump_up';
        else if (nextHero.currentSpeedX !== 0 && nextHero.isOnPlatform) {
             nextHero.action = nextHero.facingDirection === 'right' ? 'run_right' : 'run_left';
        }
        else if (nextHero.isOnPlatform) nextHero.action = 'idle'; 

        let resolvedOnPlatform = false;
        let resolvedPlatformId = null;
        let finalVelY = newVelY; 
        const heroOldBottom = nextHero.y; 

        for (const platform of nextPlatforms) {
          const heroLeft = newPosX;
          const heroRight = newPosX + nextHero.width;
          const heroProjectedBottom = newPosY; 
          const heroProjectedTop = newPosY + nextHero.height; 
          const platformTopSurface = platform.y + platform.height;
          const platformBottomSurface = platform.y;
          const platformLeft = platform.x;
          const platformRight = platform.x + platform.width;
          const horizontalOverlap = heroLeft < platformRight && heroRight > platformLeft;

          if (horizontalOverlap) {
            if (finalVelY <= 0 && heroOldBottom >= platformTopSurface && heroProjectedBottom <= platformTopSurface) { 
              newPosY = platformTopSurface; 
              finalVelY = 0;          
              resolvedOnPlatform = true;
              resolvedPlatformId = platform.id;
              if (nextHero.action === 'fall_down' || nextHero.action === 'jump_up') { 
                 nextHero.action = nextHero.currentSpeedX !==0 ? (nextHero.facingDirection === 'right' ? 'run_right' : 'run_left') : 'idle';
              }
              break; 
            }
            
            const heroOldTop = nextHero.y + nextHero.height; 
            if (finalVelY > 0 && heroOldTop <= platformBottomSurface && heroProjectedTop >= platformBottomSurface) { 
               newPosY = platformBottomSurface - nextHero.height; 
               finalVelY = -GRAVITY_ACCELERATION * 0.5; 
            }
          }
        }
        
        nextHero.x = newPosX;
        nextHero.y = newPosY;
        nextHero.velocity = { x: (nextHero.velocity?.x ?? 0), y: finalVelY }; 
        nextHero.isOnPlatform = resolvedOnPlatform;
        nextHero.platformId = resolvedPlatformId;

        if (nextHero.isOnPlatform) {
          if (nextHero.currentSpeedX === 0 && finalVelY === 0) nextHero.action = 'idle';
          else if (nextHero.currentSpeedX !== 0 && finalVelY === 0) {
            nextHero.action = nextHero.facingDirection === 'right' ? 'run_right' : 'run_left';
          }
        } else { 
          if (finalVelY > 0) nextHero.action = 'jump_up';
          else if (finalVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down';
        }

        if (nextHero.x < 0) nextHero.x = 0;
        if (nextHero.x + nextHero.width > gameArea.width) nextHero.x = gameArea.width - nextHero.width;
        
        let collectedAnyCoinThisTick = false;
        let newlyCollectedCountThisTick = 0;
        
        nextActiveCoins = nextActiveCoins.map(coin => {
          if (!coin.collected && !coin.isExploding && !coin.isSpawning && !coin.isPendingSpawn) { 
            if (nextHero.x < coin.x + coin.width &&
                nextHero.x + nextHero.width > coin.x &&
                nextHero.y < coin.y + coin.height &&
                nextHero.y + nextHero.height > coin.y) { 
              collectedAnyCoinThisTick = true;
              newlyCollectedCountThisTick++;
              return { ...coin, collected: true, isExploding: true, explosionProgress: 0 };
            }
          }
          return coin;
        });

        let shouldSpawnNextPair = false;
        if (collectedAnyCoinThisTick) {
          nextScore += newlyCollectedCountThisTick;
          nextTotalCollected += newlyCollectedCountThisTick;

          const coinsOfCurrentPair = nextActiveCoins.filter(c => c.pairId === currentPairIdx);
          if (coinsOfCurrentPair.length > 0 && coinsOfCurrentPair.every(c => c.collected)) {
            if (nextTotalCollected < TOTAL_COINS_PER_LEVEL) {
              nextPairIdx = currentPairIdx + 1;
              shouldSpawnNextPair = true;
            } else {
              levelComplete = true; 
            }
          }
        }

        nextActiveCoins = nextActiveCoins.filter(coin => !(coin.collected && coin.isExploding === false && coin.explosionProgress === 1));
        
        if (shouldSpawnNextPair) {
            const nextPairCoins = spawnNextCoinPair(gameArea, COIN_SIZE, nextPairIdx, nextPlatforms);
            nextActiveCoins = [...nextActiveCoins, ...nextPairCoins];
        }

        if (nextHero.y < 0 && !levelComplete) { 
          gameLostThisTick = true;
        }
      } 
      
      return { 
        ...state, 
        hero: nextHero, 
        platforms: nextPlatforms, 
        activeCoins: nextActiveCoins, 
        score: nextScore,
        totalCoinsCollectedInLevel: nextTotalCollected,
        currentPairIndex: nextPairIdx,
        heroAppearance: nextHeroAppearance,
        heroAppearElapsedTime: nextHeroAppearElapsedTime,
        gameOver: levelComplete, 
        gameLost: gameLostThisTick, 
        levelCompleteScreenActive: levelComplete && !gameLostThisTick, 
      };
    }
    case 'EXIT_GAME': 
      return getDefaultInitialGameState(state.gameArea.width, state.gameArea.height, 1); 
    default:
      return state;
  }
}


export function useGameLogic() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const lastTickTimeRef = useRef<number>(performance.now());

  const gameTick = useCallback(() => { 
    const now = performance.now();
    const deltaTime = now - lastTickTimeRef.current;
    lastTickTimeRef.current = now;
    dispatch({ type: 'GAME_TICK', payload: { deltaTime } });
  }, []); 

  const handleGameAction = useCallback((action: GameAction) => {
    dispatch(action);
  }, []); 
  
  useEffect(() => {
    if (gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && !gameState.isGameInitialized) {
      dispatch({ 
        type: 'UPDATE_GAME_AREA', 
        payload: { 
          width: gameState.gameArea.width, 
          height: gameState.gameArea.height, 
          paddingTop: gameState.paddingTop 
        } 
      });
    }
  }, [gameState.gameArea.width, gameState.gameArea.height, gameState.isGameInitialized, gameState.paddingTop]);


  return { gameState, dispatch: handleGameAction, gameTick };
}

