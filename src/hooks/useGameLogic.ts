
// @ts-nocheck
"use client";

import type { Reducer } from 'react';
import { useReducer, useCallback, useRef } from 'react';
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position } from '@/lib/gameTypes';

// Game constants
const GRAVITY_ACCELERATION = 0.6; // Acceleration due to gravity (pixels per frame per frame)
const MAX_FALL_SPEED = -12; // Max speed downwards (negative as Y increases upwards)
const JUMP_STRENGTH = 17.5; // Initial upward velocity for a jump (positive as Y increases upwards) - Aiming for ~250px jump height
const HERO_BASE_SPEED = 1.75; // Horizontal speed (pixels per frame)
const PLATFORM_SPEED = 1.5;

const HERO_WIDTH = 30;
const HERO_HEIGHT = 40;
const PLATFORM_DEFAULT_WIDTH = 130;
const PLATFORM_DEFAULT_HEIGHT = 24;
const COIN_SIZE = 20;
const NUM_COINS = 10; // Number of "Спасибки"

// Coin Spawning Zone constants
const COIN_ZONE_TOP_OFFSET = 50; // Distance from the top edge of the game area to the top of the coin zone
const COIN_ZONE_BOTTOM_OFFSET = 250; // Distance from the top edge of the game area to the bottom of the coin zone


const initialHeroState: HeroType = {
  id: 'hero',
  x: 0, // Will be set to gameArea.width / 2 dynamically
  y: 0, // Start with bottom of hero at y=0 (top of platform_ground, which is at y=0 of game area)
  width: HERO_WIDTH,
  height: HERO_HEIGHT,
  velocity: { x: 0, y: 0 },
  action: 'idle',
  isOnPlatform: true, 
  platformId: 'platform_ground', 
  currentSpeedX: 0,
};

const level1Platforms: PlatformType[] = [
  {
    id: 'platform_ground', x: 0, y: -PLATFORM_DEFAULT_HEIGHT, // Its top surface will be at y=0
    width: 1000, height: PLATFORM_DEFAULT_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: 100, y: 150, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 50, max: 400 }
  },
  {
    id: 'platform2', x: 300, y: 270, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 200, max: 500}
  },
];

// Helper function to generate coins ("Спасибки")
// gameArea.height here is the effectiveHeight
function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  // y_game_logic = 0 is bottom of screen. Higher y is further up.
  // The coin's y position is its bottom edge, relative to effective game area bottom.

  const coinZoneActualBottomY = gameArea.height - COIN_ZONE_BOTTOM_OFFSET - coinSize;
  const coinZoneActualTopY = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize;

  if (coinZoneActualBottomY >= coinZoneActualTopY || coinZoneActualTopY < 0 || coinZoneActualBottomY < 0) {
    console.warn("Coin spawn zone has invalid height or game area too small. Adjust gameArea height or offsets. Spawning coins in a fallback area.");
    const fallbackMinY = gameArea.height * 0.3;
    const fallbackMaxY = gameArea.height * 0.7 - coinSize;
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
      y: coinZoneActualBottomY + Math.random() * (coinZoneActualTopY - coinZoneActualBottomY),
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
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_LEFT_START':
      return { ...state, hero: { ...state.hero, currentSpeedX: -HERO_BASE_SPEED, action: 'run_left' } };
    case 'MOVE_LEFT_STOP':
      return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX < 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
    case 'MOVE_RIGHT_START':
      return { ...state, hero: { ...state.hero, currentSpeedX: HERO_BASE_SPEED, action: 'run_right' } };
    case 'MOVE_RIGHT_STOP':
      return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX > 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
    case 'JUMP':
      if (state.hero.isOnPlatform) {
        return { ...state, hero: { ...state.hero, velocity: { ...state.hero.velocity!, y: JUMP_STRENGTH }, isOnPlatform: false, platformId: null, action: 'jump_up' } };
      }
      return state;
    case 'UPDATE_GAME_AREA': {
      let { hero, coins, platforms, isGameInitialized } = state;
      const newEffectiveGameArea = { width: action.payload.width, height: action.payload.height };
      const newPaddingTop = action.payload.paddingTop;

      platforms = state.platforms.map(p => {
        if (p.id === 'platform_ground') return {...p, width: newEffectiveGameArea.width + 200, x: -100 }; 
        if (p.isMoving && p.moveAxis === 'x' && p.moveRange) {
          return { ...p, moveRange: { min: 0, max: newEffectiveGameArea.width - p.width } };
        }
        return p;
      });
      
      if (!isGameInitialized && newEffectiveGameArea.width > 0 && newEffectiveGameArea.height > 0) {
        hero = {
          ...initialHeroState,
          x: newEffectiveGameArea.width / 2 - initialHeroState.width / 2, 
          y: 0, // Hero's bottom edge at y=0 (on platform_ground's top surface)
          isOnPlatform: true,
          platformId: 'platform_ground',
          velocity: {x: 0, y: 0},
          currentSpeedX: 0,
          action: 'idle',
        };
        coins = generateCoins(NUM_COINS, newEffectiveGameArea, COIN_SIZE);
        isGameInitialized = true;
      }
      return { ...state, gameArea: newEffectiveGameArea, paddingTop: newPaddingTop, platforms, hero, coins, isGameInitialized };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized) return state;

      let { hero: heroState, platforms: currentPlatforms, coins: currentCoins, score: currentScore } = state; // Get current state
      const gameArea = state.gameArea;

      // Create mutable copies for this tick's calculations
      let nextPlatforms = currentPlatforms.map(p => ({ ...p }));
      let nextHero = { ...heroState, velocity: { ...heroState.velocity } }; // Deep copy velocity too
      let nextCoins = currentCoins.map(c => ({ ...c }));
      let nextScore = currentScore;


      // 1. Platform movement (updates platform.x and platform.velocity for *this tick*)
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
      
      // Update hero vertical velocity due to gravity
      let newVelY = (nextHero.velocity?.y ?? 0) - GRAVITY_ACCELERATION;
      newVelY = Math.max(newVelY, MAX_FALL_SPEED);

      // 2. Platform horizontal movement contribution (reads platform.velocity from *this tick's updated platforms*)
      let platformMovementEffectX = 0;
      if (nextHero.isOnPlatform && nextHero.platformId) {
        const currentPlatformInstance = nextPlatforms.find(p => p.id === nextHero.platformId);
        if (currentPlatformInstance?.isMoving && currentPlatformInstance.velocity?.x) {
          platformMovementEffectX = currentPlatformInstance.velocity.x;
        }
      }
      
      // 3. Tentative new hero positions
      let newPosX = nextHero.x + nextHero.currentSpeedX + platformMovementEffectX;
      let newPosY = nextHero.y + newVelY;
      
      // Update hero action based on velocity
      if (newVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down';
      else if (newVelY > 0) nextHero.action = 'jump_up';
      else if (nextHero.currentSpeedX !== 0 && nextHero.isOnPlatform) nextHero.action = nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left';
      else if (nextHero.isOnPlatform) nextHero.action = 'idle';


      // 4. Collision detection and resolution
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
          if (newVelY <= 0 && 
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
          if (newVelY > 0 && 
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


      // Screen boundary checks for hero X
      if (nextHero.x < 0) nextHero.x = 0;
      if (nextHero.x + nextHero.width > gameArea.width) nextHero.x = gameArea.width - nextHero.width;
      
      // Check for falling off screen
      if (nextHero.y < -nextHero.height * 2) { // Fallen well below y=0
        const resetHeroState = {
            ...initialHeroState,
            x: gameArea.width / 2 - initialHeroState.width / 2,
            y: 0, // Reset to y=0 (top of platform_ground)
            isOnPlatform: true,
            platformId: 'platform_ground',
            velocity: {x:0, y:0},
            currentSpeedX: 0,
            action: 'idle',
        };
        return { 
            ...state, 
            hero: resetHeroState,
            platforms: nextPlatforms, // Keep current platform positions
            coins: generateCoins(NUM_COINS, gameArea, COIN_SIZE), // Reset coins
            score: 0, // Reset score
            gameOver: false, 
         }; 
      }

      // Coin collection
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
      
      return { ...state, hero: nextHero, platforms: nextPlatforms, coins: nextCoins, score: nextScore };
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
