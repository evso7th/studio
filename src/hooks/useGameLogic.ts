
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
} from '@/lib/gameTypes'; 

// Game constants
const GRAVITY_ACCELERATION = 0.4; 
const MAX_FALL_SPEED = -8; 
const HERO_BASE_SPEED = 3.0; 

// Calculate JUMP_STRENGTH based on TARGET_JUMP_HEIGHT_PX and GRAVITY_ACCELERATION
const JUMP_STRENGTH = (-GRAVITY_ACCELERATION + Math.sqrt(GRAVITY_ACCELERATION * GRAVITY_ACCELERATION + 8 * GRAVITY_ACCELERATION * TARGET_JUMP_HEIGHT_PX)) / 2;


const HERO_WIDTH = 30;


const NUM_COINS = 10;

// Coin Spawning Zone constants
const COIN_ZONE_TOP_OFFSET = 50; 
const COIN_ZONE_BOTTOM_OFFSET = 250;


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

function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  
  const groundTopY = PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS; 

  const coinZoneTopEdgeGameCoords = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize; 
  const coinZoneBottomEdgeGameCoords = gameArea.height - COIN_ZONE_BOTTOM_OFFSET; 

  const effectiveMinYSpawn = Math.max(groundTopY + coinSize, coinZoneBottomEdgeGameCoords);
  const effectiveMaxYSpawn = Math.max(effectiveMinYSpawn, coinZoneTopEdgeGameCoords);


  if (effectiveMinYSpawn >= effectiveMaxYSpawn || effectiveMaxYSpawn < groundTopY + coinSize || gameArea.width <= coinSize) {
    console.warn("Coin spawn zone has invalid height, is below ground, or game area too small. Spawning coins in a fallback area above ground.");
    const fallbackMinY = groundTopY + gameArea.height * 0.1; 
    const fallbackMaxY = groundTopY + gameArea.height * 0.5 - coinSize; 
    for (let i = 0; i < count; i++) {
      coins.push({
        id: `coin${i}_${Date.now()}`,
        x: Math.random() * (gameArea.width - coinSize),
        y: fallbackMinY + Math.random() * Math.max(0, fallbackMaxY - fallbackMinY), 
        width: coinSize,
        height: coinSize,
        color: 'hsl(var(--coin-color))',
        collected: false,
        isExploding: false,
        explosionProgress: 0,
      });
    }
    return coins;
  }

  for (let i = 0; i < count; i++) {
    coins.push({
      id: `coin${i}_${Date.now()}`, 
      x: Math.random() * (gameArea.width - coinSize),
      y: effectiveMinYSpawn + Math.random() * (effectiveMaxYSpawn - effectiveMinYSpawn), 
      width: coinSize,
      height: coinSize,
      color: 'hsl(var(--coin-color))',
      collected: false,
      isExploding: false,
      explosionProgress: 0,
    });
  }
  return coins;
}


const initialGameState: GameState = {
  hero: { ...initialHeroState },
  platforms: getLevel1Platforms(800), 
  coins: [], 
  score: 0,
  currentLevel: 1,
  gameOver: false,
  gameArea: { width: 0, height: 0 }, // Start with 0,0 to force initial calculation
  isGameInitialized: false,
  paddingTop: 0,
  heroAppearance: 'appearing',
  heroAppearElapsedTime: 0,
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
      let { hero, coins, platforms, isGameInitialized } = state;
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
          isOnPlatform: true,
          platformId: 'platform_ground',
          velocity: {x: 0, y: 0},
          currentSpeedX: 0,
          action: 'idle',
        };
        
        let currentLevelPlatformsConfig = getLevel1Platforms(newEffectiveGameArea.width); 
        coins = generateCoins(NUM_COINS, newEffectiveGameArea, COIN_SIZE);
        isGameInitialized = true;
        
        return { 
          ...state, 
          gameArea: newEffectiveGameArea, 
          paddingTop: newPaddingTop, 
          platforms: currentLevelPlatformsConfig, 
          hero, 
          coins, 
          isGameInitialized,
          heroAppearance: 'appearing',
          heroAppearElapsedTime: 0,
        };
      }
      return { ...state, gameArea: newEffectiveGameArea, paddingTop: newPaddingTop, platforms };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized) return state;
      const { deltaTime } = action.payload;

      let { hero: heroState, platforms: currentPlatforms, coins: currentCoins, score: currentScore } = state;
      const gameArea = state.gameArea;
      let nextHeroAppearance = state.heroAppearance;
      let nextHeroAppearElapsedTime = state.heroAppearElapsedTime;

      let nextPlatforms = currentPlatforms.map(p => ({ ...p }));
      let nextHero = { ...heroState, velocity: { ...heroState.velocity } }; 
      let nextCoins = currentCoins.map(c => ({ ...c }));
      let nextScore = currentScore;

      // Update exploding coins
      nextCoins = nextCoins.map(coin => {
        if (coin.isExploding && coin.collected) {
          const newProgress = (coin.explosionProgress || 0) + (deltaTime / COIN_EXPLOSION_DURATION_MS);
          if (newProgress >= 1) {
            return { ...coin, isExploding: false, explosionProgress: 1 };
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
            platformNewX += platformVelX * (deltaTime / (1000/60)); // Normalize speed to 60fps assumption
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
            if (finalVelY <= 0 &&  
                heroOldBottom >= platformTopSurface && 
                heroProjectedBottom <= platformTopSurface) { 
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
            if (finalVelY > 0 && 
                heroOldTop <= platformBottomSurface && 
                heroProjectedTop >= platformBottomSurface) { 
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
        
        if (nextHero.y < 0) { 
          const resetHeroState = {
              ...initialHeroState, 
              x: gameArea.width / 2 - initialHeroState.width / 2, 
              y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS, 
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
              coins: generateCoins(NUM_COINS, gameArea, COIN_SIZE), 
              score: 0, 
              gameOver: false, 
              heroAppearance: 'appearing', 
              heroAppearElapsedTime: 0,
           }; 
        }

        let collectedSomethingThisTick = false;
        nextCoins = nextCoins.map(coin => {
          if (!coin.collected && !coin.isExploding) { // Only collect if not already collected or exploding
            if (nextHero.x < coin.x + coin.width &&
                nextHero.x + nextHero.width > coin.x &&
                nextHero.y < coin.y + coin.height &&
                nextHero.y + nextHero.height > coin.y) { 
              collectedSomethingThisTick = true;
              return { ...coin, collected: true, isExploding: true, explosionProgress: 0 };
            }
          }
          return coin;
        });

        if (collectedSomethingThisTick) {
          // Score is incremented by the number of coins that just started exploding
          const newlyCollectedCount = nextCoins.filter(
            (nc, index) => nc.isExploding && nc.explosionProgress === 0 && !currentCoins[index].isExploding
          ).length;
          nextScore = currentScore + newlyCollectedCount;
        }
      } 
      
      return { 
        ...state, 
        hero: nextHero, 
        platforms: nextPlatforms, 
        coins: nextCoins, 
        score: nextScore,
        heroAppearance: nextHeroAppearance,
        heroAppearElapsedTime: nextHeroAppearElapsedTime,
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
  }, [gameState.gameArea.width, gameState.gameArea.height, gameState.isGameInitialized, gameState.paddingTop, dispatch]);


  return { gameState, dispatch: handleGameAction, gameTick };
}
