
// @ts-nocheck
"use client";

import type { Reducer } from 'react';
import { useReducer, useCallback, useRef } from 'react';
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position } from '@/lib/gameTypes';
import { HERO_APPEARANCE_DURATION_MS, PLATFORM_DEFAULT_HEIGHT, HERO_HEIGHT, COIN_SIZE } from '@/lib/gameTypes'; 

// Game constants
const GRAVITY_ACCELERATION = 0.4; // Adjusted for smoother feel
const MAX_FALL_SPEED = -8; // Adjusted
const JUMP_STRENGTH = 11; // Adjusted from 10 to increase jump height
const HERO_BASE_SPEED = 0.75; // Adjusted from 1.0
const PLATFORM_SPEED = 1.0; // Adjusted from 1.5

const HERO_WIDTH = 30;
const PLATFORM_NON_GROUND_HEIGHT = 24; // Standard height for non-ground platforms
const PLATFORM_DEFAULT_WIDTH = 130;

const NUM_COINS = 10;

// Coin Spawning Zone constants
const COIN_ZONE_TOP_OFFSET = 50; 
const COIN_ZONE_BOTTOM_OFFSET = 250;


const initialHeroState: HeroType = {
  id: 'hero',
  x: 0, 
  y: PLATFORM_DEFAULT_HEIGHT, // Hero's bottom edge starts at the top of the ground platform
  width: HERO_WIDTH,
  height: HERO_HEIGHT,
  velocity: { x: 0, y: 0 },
  action: 'idle',
  isOnPlatform: true, 
  platformId: 'platform_ground', 
  currentSpeedX: 0,
};

// Calculate Y positions for platforms. Ground platform's top is at y = PLATFORM_DEFAULT_HEIGHT.
// Other platforms are offset from this new ground level.
const platform1_Y_Offset = 150; // desired height of platform1's bottom from ground top
const platform2_Y_Offset = 270; // desired height of platform2's bottom from ground top

const platform1_Y = PLATFORM_DEFAULT_HEIGHT + platform1_Y_Offset;
const platform2_Y = PLATFORM_DEFAULT_HEIGHT + platform2_Y_Offset;


const level1Platforms: PlatformType[] = [
  {
    id: 'platform_ground', x: 0, y: 0, // Ground platform bottom is at y=0
    width: 1000, height: PLATFORM_DEFAULT_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: 100, y: platform1_Y, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 50, max: 400 }
  },
  {
    id: 'platform2', x: 300, y: platform2_Y, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 200, max: 500}
  },
];

function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  
  const groundTopY = PLATFORM_DEFAULT_HEIGHT; 

  // Coin zone relative to gameArea height (top of screen). y=0 is bottom.
  const coinZoneAbsoluteTopEdge = gameArea.height - COIN_ZONE_TOP_OFFSET; // Top edge of the zone for coin's top
  const coinZoneAbsoluteBottomEdge = gameArea.height - COIN_ZONE_BOTTOM_OFFSET; // Bottom edge of the zone for coin's bottom

  // Convert to y-coordinates for coin's bottom edge placement
  const coinSpawnMaxY = coinZoneAbsoluteTopEdge - coinSize;
  const coinSpawnMinY = coinZoneAbsoluteBottomEdge;

  // Ensure coins spawn above the ground platform
  const effectiveMinYSpawn = Math.max(groundTopY + coinSize, coinSpawnMinY);
  const effectiveMaxYSpawn = Math.max(effectiveMinYSpawn, coinSpawnMaxY);

  if (effectiveMinYSpawn >= effectiveMaxYSpawn || effectiveMaxYSpawn < groundTopY + coinSize) {
    console.warn("Coin spawn zone has invalid height or game area too small. Spawning coins in a fallback area above ground.");
    const fallbackMinY = groundTopY + gameArea.height * 0.1; 
    const fallbackMaxY = groundTopY + gameArea.height * 0.5 - coinSize; 
    for (let i = 0; i < count; i++) {
      coins.push({
        id: `coin${i}_${Date.now()}`,
        x: Math.random() * (gameArea.width - coinSize),
        y: fallbackMinY + Math.random() * Math.max(0, fallbackMaxY - fallbackMinY), // y is bottom of coin
        width: coinSize,
        height: coinSize,
        color: 'hsl(var(--coin-color))',
        collected: false,
      });
    }
    return coins;
  }

  for (let i = 0; i < count; i++) {
    coins.push({
      id: `coin${i}_${Date.now()}`, 
      x: Math.random() * (gameArea.width - coinSize),
      y: effectiveMinYSpawn + Math.random() * (effectiveMaxYSpawn - effectiveMinYSpawn), // y is bottom of coin
      width: coinSize,
      height: coinSize,
      color: 'hsl(var(--coin-color))',
      collected: false,
    });
  }
  return coins;
}


const initialGameState: GameState = {
  hero: { ...initialHeroState },
  platforms: level1Platforms.map(p => ({...p})), 
  coins: [], 
  score: 0,
  currentLevel: 1,
  gameOver: false,
  gameArea: { width: 800, height: 600 }, 
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
        if (p.id === 'platform_ground') return {...p, width: newEffectiveGameArea.width + 200, x: -100, y: 0, height: PLATFORM_DEFAULT_HEIGHT }; 
        if (p.isMoving && p.moveAxis === 'x' && p.moveRange) {
          return { ...p, moveRange: { min: 0, max: newEffectiveGameArea.width - p.width } };
        }
        return p;
      });
      
      if (!isGameInitialized && newEffectiveGameArea.width > 0 && newEffectiveGameArea.height > 0) {
        hero = {
          ...initialHeroState,
          x: newEffectiveGameArea.width / 2 - initialHeroState.width / 2, 
          y: PLATFORM_DEFAULT_HEIGHT, // Hero's bottom edge at top of ground platform
          isOnPlatform: true,
          platformId: 'platform_ground',
          velocity: {x: 0, y: 0},
          currentSpeedX: 0,
          action: 'idle',
        };
        
        const currentLevelPlatformsConfig = level1Platforms.map(lp => {
             if (lp.id === 'platform_ground') return {...lp, width: newEffectiveGameArea.width + 200, x: -100, y:0, height: PLATFORM_DEFAULT_HEIGHT };
             if (lp.isMoving && lp.moveAxis === 'x' && lp.moveRange) {
                return { ...lp, moveRange: { min: 0, max: newEffectiveGameArea.width - lp.width } };
             }
             return lp;
        });

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

      let { hero: heroState, platforms: currentPlatforms, coins: currentCoins, score: currentScore } = state;
      const gameArea = state.gameArea;
      let nextHeroAppearance = state.heroAppearance;
      let nextHeroAppearElapsedTime = state.heroAppearElapsedTime;

      let nextPlatforms = currentPlatforms.map(p => ({ ...p }));
      let nextHero = { ...heroState, velocity: { ...heroState.velocity } }; 
      let nextCoins = currentCoins.map(c => ({ ...c }));
      let nextScore = currentScore;

      nextPlatforms = nextPlatforms.map(p => {
        if (p.isMoving && p.id !== 'platform_ground') {
          let platformNewX = p.x;
          let platformVelX = p.speed * p.direction;
          if (p.moveAxis === 'x' && p.moveRange) {
            platformNewX += platformVelX;
            if (platformNewX <= p.moveRange.min || platformNewX + p.width >= p.moveRange.max + p.width ) {
               p.direction *= -1; 
               platformVelX *= -1; 
               platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max));
            }
          }
          return { ...p, x: platformNewX, velocity: { x: platformVelX, y: 0 } };
        }
        return p; 
      });

      if (state.heroAppearance === 'appearing') {
        nextHeroAppearElapsedTime += (1000 / 60); 
        if (nextHeroAppearElapsedTime >= HERO_APPEARANCE_DURATION_MS) {
          nextHeroAppearance = 'visible';
          nextHeroAppearElapsedTime = HERO_APPEARANCE_DURATION_MS;
          nextHero.action = 'idle'; 
        }
        nextHero.velocity = { x: 0, y: 0 };
        nextHero.currentSpeedX = 0;
      } else { 
        let newVelY = (nextHero.velocity?.y ?? 0) - GRAVITY_ACCELERATION;
        newVelY = Math.max(newVelY, MAX_FALL_SPEED);

        let platformMovementEffectX = 0;
        if (nextHero.isOnPlatform && nextHero.platformId) {
          const currentPlatformInstance = nextPlatforms.find(p => p.id === nextHero.platformId);
          if (currentPlatformInstance?.isMoving && currentPlatformInstance.velocity?.x) {
            platformMovementEffectX = currentPlatformInstance.velocity.x;
          }
        }
        
        let newPosX = nextHero.x + nextHero.currentSpeedX + platformMovementEffectX;
        let newPosY = nextHero.y + newVelY;
        
        if (newVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down';
        else if (newVelY > 0) nextHero.action = 'jump_up';
        else if (nextHero.currentSpeedX !== 0 && nextHero.isOnPlatform) nextHero.action = nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left';
        else if (nextHero.isOnPlatform) nextHero.action = 'idle';

        let resolvedOnPlatform = false;
        let resolvedPlatformId = null;
        let finalVelY = newVelY; 

        const heroOldBottom = nextHero.y; // Hero's y is bottom edge

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
            // Check for landing on top of platform
            if (finalVelY <= 0 &&  // Hero is falling or stationary vertically
                heroOldBottom >= platformTopSurface && // Hero's old bottom was at or above platform top
                heroProjectedBottom <= platformTopSurface) { // Hero's new bottom is at or below platform top
              newPosY = platformTopSurface; // Snap hero's bottom to platform top
              finalVelY = 0; // Stop vertical movement          
              resolvedOnPlatform = true;
              resolvedPlatformId = platform.id;
              if (nextHero.action === 'fall_down' || nextHero.action === 'jump_up') { 
                 nextHero.action = nextHero.currentSpeedX !==0 ? (nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left') : 'idle';
              }
              break; 
            }
            
            // Check for hitting platform from below (head collision)
            const heroOldTop = nextHero.y + nextHero.height; 
            if (finalVelY > 0 && // Hero is moving up
                heroOldTop <= platformBottomSurface && // Hero's old top was at or below platform bottom
                heroProjectedTop >= platformBottomSurface) { // Hero's new top is at or above platform bottom
               newPosY = platformBottomSurface - nextHero.height; // Snap hero's top to platform bottom
               finalVelY = -GRAVITY_ACCELERATION * 0.5; // Start falling immediately
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
        
        // Hero fall detection: if hero's bottom edge is significantly below y=0 (e.g., fully off-screen)
        // Ground platform top is at y = PLATFORM_DEFAULT_HEIGHT.
        // If hero.y (bottom edge) is less than (PLATFORM_DEFAULT_HEIGHT - HERO_HEIGHT * 1.5), reset.
        if (nextHero.y < (PLATFORM_DEFAULT_HEIGHT - HERO_HEIGHT * 1.5) ) { 
          const resetHeroState = {
              ...initialHeroState,
              x: gameArea.width / 2 - initialHeroState.width / 2,
              y: PLATFORM_DEFAULT_HEIGHT, // Reset hero to be on the ground platform
              isOnPlatform: true,
              platformId: 'platform_ground',
              velocity: {x:0, y:0},
              currentSpeedX: 0,
              action: 'idle',
          };
          return { 
              ...state, 
              hero: resetHeroState,
              platforms: nextPlatforms, 
              coins: generateCoins(NUM_COINS, gameArea, COIN_SIZE), 
              score: 0, 
              gameOver: false, 
              heroAppearance: 'appearing', 
              heroAppearElapsedTime: 0,
           }; 
        }

        let collectedSomething = false;
        nextCoins = nextCoins.map(coin => {
          if (!coin.collected) {
            if (nextHero.x < coin.x + coin.width &&
                nextHero.x + nextHero.width > coin.x &&
                nextHero.y < coin.y + coin.height &&
                nextHero.y + nextHero.height > coin.y) {
              collectedSomething = true;
              return { ...coin, collected: true };
            }
          }
          return coin;
        });
        if (collectedSomething) {
          const newlyCollectedCount = nextCoins.filter(c => c.collected && !currentCoins.find(sc => sc.id === c.id && sc.collected)).length;
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

  const gameTick = useCallback(() => { 
    dispatch({ type: 'GAME_TICK', payload: { gameArea: gameState.gameArea } });
  }, [gameState.gameArea]); 

  const handleGameAction = useCallback((action: GameAction) => {
    dispatch(action);
  }, []); 
  
  return { gameState, dispatch: handleGameAction, gameTick };
}

