
// @ts-nocheck
"use client";

import type { Reducer } from 'react';
import { useReducer, useCallback, useRef } from 'react';
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position } from '@/lib/gameTypes';
import { HERO_APPEARANCE_DURATION_MS, PLATFORM_DEFAULT_HEIGHT, HERO_HEIGHT, COIN_SIZE } from '@/lib/gameTypes'; // Import more constants

// Game constants
const GRAVITY_ACCELERATION = 0.5; 
const MAX_FALL_SPEED = -10; 
const JUMP_STRENGTH = 12; 
const HERO_BASE_SPEED = 1.0; 
const PLATFORM_SPEED = 1.5;

const HERO_WIDTH = 30;
// const HERO_HEIGHT = 40; // Now from gameTypes
// const PLATFORM_DEFAULT_HEIGHT = 24; // Now from gameTypes
const PLATFORM_DEFAULT_WIDTH = 130;
// const COIN_SIZE = 20; // Now from gameTypes
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

// Calculate Y positions for platforms relative to the new ground (hero's feet at PLATFORM_DEFAULT_HEIGHT)
// Original offsets were from an old ground reference (CONTROL_PANEL_HEIGHT which was 80)
// New reference for hero feet is PLATFORM_DEFAULT_HEIGHT.
// Example: platform1 was 150 units above old hero feet. New y = 150 (offset) + PLATFORM_DEFAULT_HEIGHT (new hero feet y)
const platform1_Y = 150 + PLATFORM_DEFAULT_HEIGHT;
const platform2_Y = 270 + PLATFORM_DEFAULT_HEIGHT;


const level1Platforms: PlatformType[] = [
  {
    id: 'platform_ground', x: 0, y: 0, // Ground platform bottom is at y=0
    width: 1000, height: PLATFORM_DEFAULT_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: 100, y: platform1_Y, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 50, max: 400 }
  },
  {
    id: 'platform2', x: 300, y: platform2_Y, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 200, max: 500}
  },
];

function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  
  // Game area y=0 is bottom, y=gameArea.height is top.
  // Coin zone top offset is from gameArea.height. Coin zone bottom offset is also from gameArea.height.
  const coinZoneTopY = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize; // Top y-coord for coin bottom edge
  const coinZoneBottomY = gameArea.height - COIN_ZONE_BOTTOM_OFFSET - coinSize; // Bottom y-coord for coin bottom edge

  // Ensure coin spawn is above ground platform
  const minYSpawn = Math.max(PLATFORM_DEFAULT_HEIGHT + coinSize, coinZoneBottomY);
  const maxYSpawn = Math.max(minYSpawn, coinZoneTopY);

  if (minYSpawn >= maxYSpawn || maxYSpawn < PLATFORM_DEFAULT_HEIGHT + coinSize) {
    console.warn("Coin spawn zone has invalid height or game area too small. Spawning coins in a fallback area above ground.");
    const fallbackMinY = PLATFORM_DEFAULT_HEIGHT + gameArea.height * 0.1; // 10% above ground platform
    const fallbackMaxY = PLATFORM_DEFAULT_HEIGHT + gameArea.height * 0.5 - coinSize; // up to 50% of game height above ground
    for (let i = 0; i < count; i++) {
      coins.push({
        id: `coin${i}_${Date.now()}`,
        x: Math.random() * (gameArea.width - coinSize),
        y: fallbackMinY + Math.random() * Math.max(0, fallbackMaxY - fallbackMinY),
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
      y: minYSpawn + Math.random() * (maxYSpawn - minYSpawn), // y is bottom of coin
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

      // Re-calculate platform positions based on new game area if necessary
      // Ground platform y is fixed at 0, its width spans the game area.
      // Other platforms' y are fixed based on initial setup.
      // Moving platforms' x ranges need to adapt to game width.
      platforms = state.platforms.map(p => {
        if (p.id === 'platform_ground') return {...p, width: newEffectiveGameArea.width + 200, x: -100, y: 0 }; 
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
        // Use updated platform definitions for coin generation if they depend on gameArea
        const currentLevelPlatforms = level1Platforms.map(lp => {
             if (lp.id === 'platform_ground') return {...lp, width: newEffectiveGameArea.width + 200, x: -100, y:0 };
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
          platforms: currentLevelPlatforms, // Use recalculated platforms
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

        const heroOldBottom = nextHero.y;

        for (const platform of nextPlatforms) {
          const heroLeft = newPosX;
          const heroRight = newPosX + nextHero.width;
          const heroNewBottom = newPosY; 
          const heroNewTop = newPosY + nextHero.height;

          const platformTopSurface = platform.y + platform.height;
          const platformBottomSurface = platform.y;
          const platformLeft = platform.x;
          const platformRight = platform.x + platform.width;
          
          const horizontalOverlap = heroLeft < platformRight && heroRight > platformLeft;

          if (horizontalOverlap) {
            if (finalVelY <= 0 && 
                heroOldBottom >= platformTopSurface && 
                heroNewBottom <= platformTopSurface) { 
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
                heroNewTop >= platformBottomSurface) { 
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
        
        // Hero fall detection: if hero's bottom edge is significantly below y=0 (e.g., fully off-screen)
        // PLATFORM_DEFAULT_HEIGHT is the height of the ground platform. Hero's feet are at this y when on ground.
        // If hero.y (bottom edge) is less than (PLATFORM_DEFAULT_HEIGHT - HERO_HEIGHT * 1.5), reset.
        // This is equivalent to (24 - 40 * 1.5) = 24 - 60 = -36.
        // So if hero's bottom edge is below y = -36, they reset.
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
              platforms: nextPlatforms, // Keep current platform states (e.g. moving positions)
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

