
// @ts-nocheck
"use client";

import type { Reducer } from 'react';
import { useReducer, useCallback, useRef } from 'react';
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position } from '@/lib/gameTypes';

// Game constants
const GRAVITY_ACCELERATION = 0.8; // Acceleration due to gravity (pixels per frame per frame)
const MAX_FALL_SPEED = -15; // Max speed downwards (negative as Y increases upwards)
const JUMP_STRENGTH = 15; // Initial upward velocity for a jump (positive as Y increases upwards)
const HERO_BASE_SPEED = 5; // Horizontal speed (pixels per frame)
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
  y: PLATFORM_DEFAULT_HEIGHT, // Start on an implicit ground or first platform (bottom of hero at this Y, relative to effective game area bottom)
  width: HERO_WIDTH,
  height: HERO_HEIGHT,
  velocity: { x: 0, y: 0 },
  action: 'idle',
  isOnPlatform: true, // Starts on ground
  platformId: 'platform_ground', // Assumes a ground platform with this ID
  currentSpeedX: 0,
};

const level1Platforms: PlatformType[] = [
  {
    id: 'platform_ground', x: 0, y: 0, width: 1000, height: PLATFORM_DEFAULT_HEIGHT, // y=0 means bottom of platform is at effective gameArea bottom
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: 100, y: 150, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT, // Lowered by 50px (was 200)
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 50, max: 400 }
  },
  {
    id: 'platform2', x: 300, y: 320, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 200, max: 500}
  },
];

// Helper function to generate coins ("Спасибки")
// gameArea.height here is the effectiveHeight
function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  // y_game_logic = 0 is bottom of screen. Higher y is further up. (This is correct for rendering)
  // The coin's y position is its bottom edge, relative to effective game area bottom.

  // Bottom of the spawn zone for the coin's bottom edge (in Y-up coords relative to effective game area bottom):
  const coinZoneActualBottomY = gameArea.height - COIN_ZONE_BOTTOM_OFFSET - coinSize;
  // Top of the spawn zone for the coin's bottom edge (in Y-up coords relative to effective game area bottom):
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
      id: `coin${i}_${Date.now()}`, // Unique ID for key prop
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
  platforms: level1Platforms.map(p => ({...p})), // Ensure a fresh copy for potential modifications
  coins: [], // Coins will be generated dynamically
  score: 0,
  currentLevel: 1,
  gameOver: false,
  gameArea: { width: 800, height: 600 }, // Default effective game area, will be updated
  isGameInitialized: false,
  paddingTop: 0, // Initialize paddingTop
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

      // Adjust platform properties based on the new effective game area size
      // This is important if platforms are relative to game area dimensions (e.g., ground platform width)
      platforms = state.platforms.map(p => {
        if (p.id === 'platform_ground') return {...p, width: newEffectiveGameArea.width + 200, x: -100 }; // Ground platform spans wider than screen
        if (p.isMoving && p.moveAxis === 'x' && p.moveRange) {
          // Ensure moving platforms stay within new game area width
          // Note: x coordinates of platforms are relative to the left of effective game area
          return { ...p, moveRange: { min: 0, max: newEffectiveGameArea.width - p.width } };
        }
        return p;
      });
      
      const groundPlatform = platforms.find(p => p.id === 'platform_ground');
      // groundPlatform.y is 0 (relative to effective game area bottom)
      // groundPlatformTopSurfaceY is PLATFORM_DEFAULT_HEIGHT (relative to effective game area bottom)
      const groundPlatformTopSurfaceY = groundPlatform ? groundPlatform.y + groundPlatform.height : PLATFORM_DEFAULT_HEIGHT;


      if (!isGameInitialized && newEffectiveGameArea.width > 0 && newEffectiveGameArea.height > 0) {
        hero = {
          ...initialHeroState,
          x: newEffectiveGameArea.width / 2 - initialHeroState.width / 2, // Centered in effective width
          y: groundPlatformTopSurfaceY, // Hero's bottom edge at platform's top surface (relative to effective bottom)
          isOnPlatform: true,
          platformId: 'platform_ground',
          velocity: {x: 0, y: 0},
          currentSpeedX: 0,
          action: 'idle',
        };
        // Generate coins within the effective game area
        coins = generateCoins(NUM_COINS, newEffectiveGameArea, COIN_SIZE);
        isGameInitialized = true;
      }
      // Update state with new effective game area size and paddingTop
      return { ...state, gameArea: newEffectiveGameArea, paddingTop: newPaddingTop, platforms, hero, coins, isGameInitialized };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized) return state;

      let { hero, platforms, coins, score } = { ...state };
      const gameArea = state.gameArea; // This is effective game area

      // Update hero vertical velocity due to gravity (Y is up)
      let newVelY = (hero.velocity?.y ?? 0) - GRAVITY_ACCELERATION;
      newVelY = Math.max(newVelY, MAX_FALL_SPEED); // Apply max fall speed (it's negative)

      // Platform horizontal movement contribution
      let platformMovementEffectX = 0;
      if (hero.isOnPlatform && hero.platformId) {
        const currentPlatform = platforms.find(p => p.id === hero.platformId);
        if (currentPlatform?.isMoving && currentPlatform.velocity?.x) {
          platformMovementEffectX = currentPlatform.velocity.x;
        }
      }
      
      // Tentative new positions (relative to effective game area)
      let newPosX = hero.x + hero.currentSpeedX + platformMovementEffectX;
      let newPosY = hero.y + newVelY; // hero.y is bottom of hero
      
      // Update hero action based on velocity (Y is up)
      if (newVelY < -GRAVITY_ACCELERATION * 0.5) hero.action = 'fall_down'; // Threshold for falling animation
      else if (newVelY > 0) hero.action = 'jump_up';
      else if (hero.currentSpeedX !== 0 && hero.isOnPlatform) hero.action = hero.currentSpeedX > 0 ? 'run_right' : 'run_left';
      else if (hero.isOnPlatform) hero.action = 'idle';


      // Platform movement (coordinates relative to effective game area)
      platforms = platforms.map(p => {
        if (p.isMoving && p.id !== 'platform_ground') {
          let platformNewX = p.x;
          let platformVelX = p.speed * p.direction;
          if (p.moveAxis === 'x' && p.moveRange) {
            platformNewX += platformVelX;
            if (platformNewX <= p.moveRange.min || platformNewX + p.width >= p.moveRange.max + p.width ) {
               p.direction *= -1; // Reverse direction
               platformVelX *= -1; // Velocity for this frame is reversed
               // Clamp position to avoid overshooting significantly in one frame
               platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max));
            }
          }
          return { ...p, x: platformNewX, velocity: { x: platformVelX, y:0 } };
        }
        return p; 
      });
      
      // Collision detection and resolution (coordinates relative to effective game area)
      let resolvedOnPlatform = false;
      let resolvedPlatformId = null;
      let finalVelY = newVelY; 

      const heroOldBottom = hero.y;

      for (const platform of platforms) {
        const heroLeft = newPosX;
        const heroRight = newPosX + hero.width;
        const heroNewBottom = newPosY; 
        const heroNewTop = newPosY + hero.height;

        // Platform coordinates are relative to effective game area bottom-left
        const platformTopSurface = platform.y + platform.height;
        const platformBottomSurface = platform.y;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        const horizontalOverlap = heroLeft < platformRight && heroRight > platformLeft;

        if (horizontalOverlap) {
          // Landing on a platform
          if (newVelY <= 0 && 
              heroOldBottom >= platformTopSurface && 
              heroNewBottom <= platformTopSurface) { 
            
            newPosY = platformTopSurface; 
            finalVelY = 0;            
            resolvedOnPlatform = true;
            resolvedPlatformId = platform.id;
            if (hero.action === 'fall_down' || hero.action === 'jump_up') { 
               hero.action = hero.currentSpeedX !==0 ? (hero.currentSpeedX > 0 ? 'run_right' : 'run_left') : 'idle';
            }
            break; 
          }
          // Hitting a platform from below
          const heroOldTop = hero.y + hero.height;
          if (newVelY > 0 && 
              heroOldTop <= platformBottomSurface && 
              heroNewTop >= platformBottomSurface) { 
             newPosY = platformBottomSurface - hero.height; 
             finalVelY = -GRAVITY_ACCELERATION * 0.5; // Bonk head, start falling
             // No break here, allow checking other platforms for landing in the same frame if bonk leads to immediate fall.
          }
        }
      }
      
      hero.x = newPosX;
      hero.y = newPosY;
      hero.velocity = { x: (hero.velocity?.x ?? 0), y: finalVelY };
      hero.isOnPlatform = resolvedOnPlatform;
      hero.platformId = resolvedPlatformId;

      if (hero.isOnPlatform) {
        if (hero.currentSpeedX === 0 && finalVelY === 0) hero.action = 'idle';
        else if (hero.currentSpeedX !== 0 && finalVelY === 0) hero.action = hero.currentSpeedX > 0 ? 'run_right' : 'run_left';
      } else { 
        if (finalVelY > 0) hero.action = 'jump_up';
        else if (finalVelY < -GRAVITY_ACCELERATION * 0.5) hero.action = 'fall_down';
      }

      // Screen boundary checks for hero X (relative to effective game area width)
      if (hero.x < 0) hero.x = 0;
      if (hero.x + hero.width > gameArea.width) hero.x = gameArea.width - hero.width;
      
      // Check for falling off screen (Y is relative to effective game area bottom)
      if (hero.y < -hero.height * 2) { 
        const groundPlatform = platforms.find(p => p.id === 'platform_ground')!;
        const groundPlatformTop = groundPlatform.y + groundPlatform.height; // This y is 0, so top is PLATFORM_DEFAULT_HEIGHT
        const resetHeroState = {
            ...initialHeroState,
            x: gameArea.width / 2 - initialHeroState.width / 2,
            y: groundPlatformTop, // Reset to ground platform top (relative to effective bottom)
            isOnPlatform: true,
            platformId: 'platform_ground',
            velocity: {x:0, y:0},
            currentSpeedX: 0,
            action: 'idle',
        };
        return { 
            ...state, 
            hero: resetHeroState,
            coins: generateCoins(NUM_COINS, gameArea, COIN_SIZE), 
            score: 0, 
            gameOver: false, 
         }; 
      }

      // Coin collection
      let collectedSomething = false;
      coins = coins.map(coin => {
        if (!coin.collected) {
          if (hero.x < coin.x + coin.width &&
              hero.x + hero.width > coin.x &&
              hero.y < coin.y + coin.height && 
              hero.y + hero.height > coin.y) { 
            collectedSomething = true;
            return { ...coin, collected: true };
          }
        }
        return coin;
      });
      if (collectedSomething) {
        const newlyCollectedCount = coins.filter(c => c.collected && !state.coins.find(sc => sc.id === c.id && sc.collected)).length;
        score = state.score + newlyCollectedCount;
      }
      
      return { ...state, hero: { ...hero }, platforms, coins, score };
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

