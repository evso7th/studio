
// @ts-nocheck
"use client";

import type { Reducer} from 'react';
import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position } from '@/lib/gameTypes'; 
import { 
    HERO_APPEARANCE_DURATION_MS, 
    PLATFORM_GROUND_Y, 
    PLATFORM_GROUND_THICKNESS, 
    HERO_HEIGHT, 
    COIN_SIZE,
    PLATFORM_NON_GROUND_HEIGHT,
    PLATFORM_DEFAULT_WIDTH,
    TARGET_JUMP_HEIGHT_PX,
    PLATFORM1_Y_OFFSET,
    PLATFORM2_Y_OFFSET,
    INITIAL_PLATFORM1_X_PERCENT,
    INITIAL_PLATFORM1_SPEED,
    INITIAL_PLATFORM2_X_PERCENT,
    INITIAL_PLATFORM2_SPEED,
    COIN_EXPLOSION_DURATION_MS,
    TOTAL_COINS_PER_LEVEL,
    COINS_PER_PAIR,
    COIN_SPAWN_EXPLOSION_DURATION_MS,
    MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR,
    COIN_ZONE_TOP_OFFSET,
    // COIN_ZONE_BOTTOM_OFFSET, // This will be effectively overridden by platform1's height
} from '@/lib/gameTypes'; 

const GRAVITY_ACCELERATION = 0.4; 
const MAX_FALL_SPEED = -8; 
const HERO_BASE_SPEED = 0.75; 

const JUMP_STRENGTH = (-GRAVITY_ACCELERATION + Math.sqrt(GRAVITY_ACCELERATION * GRAVITY_ACCELERATION + 8 * GRAVITY_ACCELERATION * TARGET_JUMP_HEIGHT_PX)) / 2;

const HERO_WIDTH = 30;

const initialHeroState: HeroType = {
  id: 'hero',
  x: 0, 
  y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS, 
  width: HERO_WIDTH,
  height: HERO_HEIGHT, 
  velocity: { x: 0, y: 0 },
  action: 'idle',
  isOnPlatform: true, 
  platformId: 'platform_ground', 
  currentSpeedX: 0,
};

const getLevel1Platforms = (gameAreaWidth: number): PlatformType[] => [
  {
    id: 'platform_ground', x: -100, y: PLATFORM_GROUND_Y, 
    width: gameAreaWidth + 200, height: PLATFORM_GROUND_THICKNESS, 
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: gameAreaWidth * INITIAL_PLATFORM1_X_PERCENT, y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS + PLATFORM1_Y_OFFSET, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: true, speed: INITIAL_PLATFORM1_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH } 
  },
  {
    id: 'platform2', x: gameAreaWidth * INITIAL_PLATFORM2_X_PERCENT, y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS + PLATFORM2_Y_OFFSET, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: INITIAL_PLATFORM2_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH } 
  },
];

function spawnNextCoinPair(gameArea: Size, coinSize: number, currentPairId: number): CoinType[] {
  if (!gameArea.width || !gameArea.height) return [];
  const newPair: CoinType[] = [];
  const groundPlatformTopY = PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS;

  // Calculate the Y-coordinate of the top surface of platform1 (the lower moving platform)
  const platform1TopActualY = PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS + PLATFORM1_Y_OFFSET + PLATFORM_NON_GROUND_HEIGHT;

  // Define the highest possible Y for the coin's bottom edge (constrained by COIN_ZONE_TOP_OFFSET from game top)
  const coinSpawnZoneCeilingY = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize;
  
  // Define the lowest possible Y for the coin's bottom edge (must be above platform1's top surface)
  const coinSpawnZoneFloorY = platform1TopActualY;

  // Determine effective spawn range for the coin's bottom Y-coordinate
  let effectiveMinSpawnY = Math.max(groundPlatformTopY, coinSpawnZoneFloorY); // Cannot be below ground, cannot be below platform1 top
  let effectiveMaxSpawnY = coinSpawnZoneCeilingY;

  // Adjust if min is greater than or equal to max (no valid range or single point for random generation)
  if (effectiveMinSpawnY >= effectiveMaxSpawnY) {
    // Attempt to place just above platform1 if there's any space at all below the absolute ceiling of the game area
    // Check if there's at least 1px space for the coin (plus its size) above platform1's top surface and below the very top of the game area.
    if (platform1TopActualY + coinSize < gameArea.height -1 ) { 
        effectiveMinSpawnY = platform1TopActualY + 1; // Place 1px above platform1 top
        effectiveMaxSpawnY = effectiveMinSpawnY;    // Spawn at a fixed height, so yRandomFactorRange will be 0
    } else {
        console.warn("Coin spawn zone invalid: Platform1 is too high or COIN_ZONE_TOP_OFFSET is too restrictive. No space to spawn coins.");
        return []; // Cannot spawn
    }
  }
  
  const yRandomFactorRange = effectiveMaxSpawnY - effectiveMinSpawnY; // This can be 0 if effectiveMinSpawnY === effectiveMaxSpawnY

  const minDistanceX = gameArea.width * MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR;

  // Spawn first coin
  const x1 = Math.random() * (gameArea.width - coinSize);
  // If yRandomFactorRange is 0 or negative, coin spawns at effectiveMinSpawnY. Otherwise, random within range.
  const y1 = effectiveMinSpawnY + (yRandomFactorRange > 0 ? (Math.random() * yRandomFactorRange) : 0);
  newPair.push({
    id: `coin_p${currentPairId}_0_${Date.now()}`,
    x: x1, y: y1, width: coinSize, height: coinSize,
    color: 'hsl(var(--coin-color))', collected: false, isExploding: false, explosionProgress: 0,
    isSpawning: true, spawnExplosionProgress: 0, pairId: currentPairId,
  });

  // Spawn second coin, ensuring horizontal distance from the first
  let x2, y2;
  let attempts = 0;
  do {
    x2 = Math.random() * (gameArea.width - coinSize);
    attempts++;
  } while (Math.abs(x2 - x1) < minDistanceX && attempts < 20); 
  
  y2 = effectiveMinSpawnY + (yRandomFactorRange > 0 ? (Math.random() * yRandomFactorRange) : 0);

  newPair.push({
    id: `coin_p${currentPairId}_1_${Date.now()}`,
    x: x2, y: y2, width: coinSize, height: coinSize,
    color: 'hsl(var(--coin-color))', collected: false, isExploding: false, explosionProgress: 0,
    isSpawning: true, spawnExplosionProgress: 0, 
    pairId: currentPairId,
  });

  return newPair;
}


const initialGameState: GameState = {
  hero: { ...initialHeroState },
  platforms: getLevel1Platforms(800), 
  activeCoins: [], 
  score: 0,
  currentLevel: 1,
  gameOver: false,
  gameArea: { width: 0, height: 0 },
  isGameInitialized: false,
  paddingTop: 0,
  heroAppearance: 'appearing',
  heroAppearElapsedTime: 0,
  totalCoinsCollectedInLevel: 0,
  currentPairIndex: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_LEFT_START':
      if (state.heroAppearance === 'visible') {
        return { ...state, hero: { ...state.hero, currentSpeedX: -HERO_BASE_SPEED, action: 'run_left' } };
      }
      return state;
    case 'MOVE_LEFT_STOP':
      if (state.heroAppearance === 'visible') {
        return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX < 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
      }
      return state;
    case 'MOVE_RIGHT_START':
      if (state.heroAppearance === 'visible') {
        return { ...state, hero: { ...state.hero, currentSpeedX: HERO_BASE_SPEED, action: 'run_right' } };
      }
      return state;
    case 'MOVE_RIGHT_STOP':
      if (state.heroAppearance === 'visible') {
        return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX > 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
      }
      return state;
    case 'JUMP':
      if (state.heroAppearance === 'visible' && state.hero.isOnPlatform) {
        return { ...state, hero: { ...state.hero, velocity: { ...state.hero.velocity!, y: JUMP_STRENGTH }, isOnPlatform: false, platformId: null, action: 'jump_up' } };
      }
      return state;
    case 'UPDATE_GAME_AREA': {
      let { hero, activeCoins, platforms, isGameInitialized, currentPairIndex, totalCoinsCollectedInLevel, score } = state;
      const newEffectiveGameArea = { width: action.payload.width, height: action.payload.height };
      const newPaddingTop = action.payload.paddingTop;

      platforms = state.platforms.map(p => {
        if (p.id === 'platform_ground') {
            return {...p, width: newEffectiveGameArea.width + 200, x: -100, y: PLATFORM_GROUND_Y }; 
        }
        if (p.isMoving && p.moveAxis === 'x') {
          return { ...p, 
            x: Math.min(p.x, newEffectiveGameArea.width - p.width), 
            moveRange: { min: 0, max: newEffectiveGameArea.width - p.width } };
        }
        return p;
      });
      
      if (!isGameInitialized && newEffectiveGameArea.width > 0 && newEffectiveGameArea.height > 0) {
        hero = {
          ...initialHeroState, 
          x: newEffectiveGameArea.width / 2 - initialHeroState.width / 2, 
          y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS, 
          height: HERO_HEIGHT,
          isOnPlatform: true,
          platformId: 'platform_ground',
          velocity: {x: 0, y: 0},
          currentSpeedX: 0,
          action: 'idle',
        };
        
        let currentLevelPlatformsConfig = getLevel1Platforms(newEffectiveGameArea.width); 
        activeCoins = spawnNextCoinPair(newEffectiveGameArea, COIN_SIZE, 0);
        isGameInitialized = true;
        currentPairIndex = 0;
        totalCoinsCollectedInLevel = 0;
        score = 0;
        
        return { 
          ...state, 
          gameArea: newEffectiveGameArea, 
          paddingTop: newPaddingTop, 
          platforms: currentLevelPlatformsConfig, 
          hero, 
          activeCoins, 
          isGameInitialized,
          heroAppearance: 'appearing',
          heroAppearElapsedTime: 0,
          currentPairIndex,
          totalCoinsCollectedInLevel,
          score,
        };
      }
      return { ...state, gameArea: newEffectiveGameArea, paddingTop: newPaddingTop, platforms };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized) return state;
      const { deltaTime } = action.payload;

      let { hero: heroState, platforms: currentPlatforms, activeCoins: currentActiveCoins, score: currentScore, totalCoinsCollectedInLevel: currentTotalCollected, currentPairIndex: currentPairIdx } = state;
      const gameArea = state.gameArea;
      let nextHeroAppearance = state.heroAppearance;
      let nextHeroAppearElapsedTime = state.heroAppearElapsedTime;

      let nextPlatforms = currentPlatforms.map(p => ({ ...p }));
      let nextHero = { ...heroState, velocity: { ...heroState.velocity } }; 
      let nextActiveCoins = currentActiveCoins.map(c => ({ ...c }));
      let nextScore = currentScore;
      let nextTotalCollected = currentTotalCollected;
      let nextPairIdx = currentPairIdx;
      let levelComplete = false; // Becomes true if all coins collected

      // Update SPAWNING coins (appearance explosion)
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
      
      // Update COLLECTED coins (collection explosion)
      nextActiveCoins = nextActiveCoins.map(coin => {
        if (coin.isExploding && coin.collected) {
          const newProgress = (coin.explosionProgress || 0) + (deltaTime / COIN_EXPLOSION_DURATION_MS);
          if (newProgress >= 1) {
            return { ...coin, isExploding: false, explosionProgress: 1 }; // Mark as no longer exploding for removal later
          }
          return { ...coin, explosionProgress: newProgress };
        }
        return coin;
      });

      nextPlatforms = nextPlatforms.map(p => {
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
          return { ...p, x: platformNewX, velocity: { x: platformVelX, y: 0 } };
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
        else if (nextHero.currentSpeedX !== 0 && nextHero.isOnPlatform) nextHero.action = nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left';
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
                 nextHero.action = nextHero.currentSpeedX !==0 ? (nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left') : 'idle';
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
          else if (nextHero.currentSpeedX !== 0 && finalVelY === 0) nextHero.action = nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left';
        } else { 
          if (finalVelY > 0) nextHero.action = 'jump_up';
          else if (finalVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down';
        }

        if (nextHero.x < 0) nextHero.x = 0;
        if (nextHero.x + nextHero.width > gameArea.width) nextHero.x = gameArea.width - nextHero.width;
        
        // Coin collection logic
        let collectedAnyCoinThisTick = false;
        let newlyCollectedCountThisTick = 0;
        
        nextActiveCoins = nextActiveCoins.map(coin => {
          if (!coin.collected && !coin.isExploding && !coin.isSpawning) { // Can only collect fully spawned, non-exploding coins
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

          // Check if all coins of the current pair are collected
          const coinsOfCurrentPair = nextActiveCoins.filter(c => c.pairId === currentPairIdx);
          if (coinsOfCurrentPair.length > 0 && coinsOfCurrentPair.every(c => c.collected)) {
            if (nextTotalCollected < TOTAL_COINS_PER_LEVEL) {
              nextPairIdx = currentPairIdx + 1;
              shouldSpawnNextPair = true;
            } else {
              levelComplete = true; // All coins collected
            }
          }
        }

        // Remove coins that finished their collection explosion
        nextActiveCoins = nextActiveCoins.filter(coin => !(coin.collected && coin.isExploding === false && coin.explosionProgress === 1));
        
        if (shouldSpawnNextPair) {
            const nextPairCoins = spawnNextCoinPair(gameArea, COIN_SIZE, nextPairIdx);
            nextActiveCoins = [...nextActiveCoins, ...nextPairCoins];
        }

        // Hero falls off screen: Reset game state for the level
        if (nextHero.y < 0) { 
          const resetHeroState = {
              ...initialHeroState, 
              x: gameArea.width / 2 - initialHeroState.width / 2, 
              y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS, 
              height: HERO_HEIGHT,
              isOnPlatform: true,
              platformId: 'platform_ground',
              velocity: {x:0, y:0},
              currentSpeedX: 0,
              action: 'idle',
          };
          let newLevelPlatforms = getLevel1Platforms(gameArea.width);
          
          return { 
              ...state, 
              hero: resetHeroState,
              platforms: newLevelPlatforms, 
              activeCoins: spawnNextCoinPair(gameArea, COIN_SIZE, 0), 
              score: 0, 
              totalCoinsCollectedInLevel: 0,
              currentPairIndex: 0,
              gameOver: false, // Game is not over, just reset level state
              heroAppearance: 'appearing', 
              heroAppearElapsedTime: 0,
           }; 
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
        gameOver: levelComplete, // gameOver becomes true when level is complete
      };
    }
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
    dispatch({ type: 'GAME_TICK', payload: { gameArea: gameState.gameArea, deltaTime } });
  }, [gameState.gameArea]); 

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

