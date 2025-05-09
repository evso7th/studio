// @ts-nocheck
"use client";

import type { Reducer } from 'react';
import { useReducer, useCallback, useRef } from 'react';
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size, Position } from '@/lib/gameTypes';

// Game constants
const GRAVITY = 0.8; // Acceleration due to gravity (pixels per frame per frame)
const MAX_FALL_SPEED = 15;
const JUMP_VELOCITY = -15; // Initial upward velocity for a jump (negative as Y increases upwards)
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
  y: PLATFORM_DEFAULT_HEIGHT, // Start on an implicit ground or first platform
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
    id: 'platform_ground', x: 0, y: 0, width: 1000, height: PLATFORM_DEFAULT_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: 100, y: 200, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT,
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
function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  // y_game_logic = 0 is bottom of screen. Higher y is further up.
  // The coin's y position is its bottom edge.
  
  // Bottom of the spawn zone for the coin's bottom edge:
  const coinZoneActualBottomY = gameArea.height - COIN_ZONE_BOTTOM_OFFSET;
  // Top of the spawn zone for the coin's bottom edge:
  const coinZoneActualTopY = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize;

  if (coinZoneActualBottomY >= coinZoneActualTopY || gameArea.height < COIN_ZONE_BOTTOM_OFFSET) {
    console.warn("Coin spawn zone has invalid height or game area too small. Adjust gameArea height or offsets. Spawning coins in a fallback area.");
    const fallbackMinY = gameArea.height * 0.3; // A bit lower than middle
    const fallbackMaxY = gameArea.height * 0.7 - coinSize; // A bit higher than middle
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
  platforms: level1Platforms,
  coins: [], // Coins will be generated dynamically
  score: 0,
  currentLevel: 1,
  gameOver: false,
  gameArea: { width: 800, height: 600 }, // Default, will be updated
  isGameInitialized: false,
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
        return { ...state, hero: { ...state.hero, velocity: { ...state.hero.velocity!, y: JUMP_VELOCITY }, isOnPlatform: false, platformId: null, action: 'jump_up' } };
      }
      return state;
    case 'UPDATE_GAME_AREA': {
      let { hero, coins, platforms, isGameInitialized, gameArea } = state;
      const newGameArea = action.payload;

      platforms = platforms.map(p => {
        if (p.id === 'platform_ground') return {...p, width: newGameArea.width + 200, x: -100 };
        if (p.isMoving && p.moveAxis === 'x' && p.moveRange) {
          return { ...p, moveRange: { min: 0, max: newGameArea.width - p.width } };
        }
        return p;
      });
      
      const groundPlatform = platforms.find(p => p.id === 'platform_ground');
      const groundPlatformHeight = groundPlatform ? groundPlatform.height : PLATFORM_DEFAULT_HEIGHT;


      if (!isGameInitialized && newGameArea.width > 0 && newGameArea.height > 0) {
        hero = {
          ...initialHeroState,
          x: newGameArea.width / 2 - initialHeroState.width / 2,
          y: groundPlatformHeight,
          isOnPlatform: true,
          platformId: 'platform_ground',
        };
        coins = generateCoins(NUM_COINS, newGameArea, COIN_SIZE);
        isGameInitialized = true;
      }

      return { ...state, gameArea: newGameArea, platforms, hero, coins, isGameInitialized };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized) return state; // Don't run game logic if not initialized

      let { hero, platforms, coins, score } = { ...state };
      const gameArea = state.gameArea; // Use current gameArea from state

      // Update hero velocity and position
      let newVelY = (hero.velocity?.y ?? 0) + GRAVITY;
      newVelY = Math.min(newVelY, MAX_FALL_SPEED); // Terminal velocity

      let newPosX = hero.x + hero.currentSpeedX + (hero.isOnPlatform && platforms.find(p => p.id === hero.platformId)?.velocity?.x ? platforms.find(p => p.id === hero.platformId)!.velocity!.x : (hero.velocity?.x ?? 0));
      let newPosY = hero.y + newVelY;
      
      hero = { ...hero, velocity: { x: (hero.velocity?.x ?? 0), y: newVelY } };
      
      if (newVelY > GRAVITY * 1.5) hero.action = 'fall_down'; // Adjusted threshold
      else if (newVelY < 0) hero.action = 'jump_up';
      else if (hero.currentSpeedX !== 0 && hero.isOnPlatform) hero.action = hero.currentSpeedX > 0 ? 'run_right' : 'run_left';
      else if (hero.isOnPlatform) hero.action = 'idle';


      // Platform movement
      platforms = platforms.map(p => {
        if (p.isMoving && p.id !== 'platform_ground') {
          let platformNewX = p.x;
          let platformVelX = p.speed * p.direction;
          if (p.moveAxis === 'x' && p.moveRange) {
            platformNewX += platformVelX;
            if (platformNewX <= p.moveRange.min || platformNewX + p.width >= p.moveRange.max + p.width ) { // check p.width too
               platformVelX *= -1; 
               p.direction *= -1;
               platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max));
            }
          }
          return { ...p, x: platformNewX, velocity: { x: platformVelX, y:0 } };
        }
        return p;
      });
      
      hero.isOnPlatform = false;
      hero.platformId = null;

      for (const platform of platforms) {
        const heroBottom = newPosY;
        const heroTop = newPosY + hero.height;
        const heroLeft = newPosX;
        const heroRight = newPosX + hero.width;

        const platformTopSurface = platform.y + platform.height;
        const platformBottomSurface = platform.y;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        const horizontalOverlap = heroLeft < platformRight && heroRight > platformLeft;

        if (horizontalOverlap) {
          const prevHeroBottom = hero.y;
          if (prevHeroBottom >= platformTopSurface && heroBottom <= platformTopSurface && (hero.velocity?.y ?? 0) >= 0) {
            newPosY = platformTopSurface; 
            hero.velocity = { ...hero.velocity!, y: 0 };
            hero.isOnPlatform = true;
            hero.platformId = platform.id;
            if (hero.action === 'fall_down' || hero.action === 'jump_up') {
               hero.action = hero.currentSpeedX !==0 ? (hero.currentSpeedX > 0 ? 'run_right' : 'run_left') : 'idle';
            }
             if (platform.isMoving && platform.velocity) {
                // This was adding platform velocity twice, already handled in newPosX calculation.
                // newPosX += platform.velocity.x; 
             }
            break; 
          }
          else if (hero.y < platformBottomSurface && heroTop >= platformBottomSurface && (hero.velocity?.y ?? 0) < 0 ) { // Hitting platform from below
             newPosY = platformBottomSurface - hero.height;
             hero.velocity = { ...hero.velocity!, y: GRAVITY }; // Bounce off slightly or just stop
          }
        }
      }
      
      hero.x = newPosX;
      hero.y = newPosY;

      if (hero.x < 0) hero.x = 0;
      if (hero.x + hero.width > gameArea.width) hero.x = gameArea.width - hero.width;
      
      if (hero.y < -hero.height * 2) { // Fell far off screen
        const groundPlatform = platforms.find(p => p.id === 'platform_ground')!;
        const resetHeroState = {
            ...initialHeroState,
            x: gameArea.width / 2 - initialHeroState.width / 2,
            y: groundPlatform.height,
            isOnPlatform: true,
            platformId: 'platform_ground',
        };
        return { 
            ...state, // Keep current level, potentially other stats
            hero: resetHeroState,
            coins: generateCoins(NUM_COINS, gameArea, COIN_SIZE), // Regenerate coins
            score: 0, // Reset score on fall
            gameOver: false, // Or set to true and handle restart
         }; 
      }

      // Coin collection
      let collectedSomething = false;
      coins = coins.map(coin => {
        if (!coin.collected) {
          // Simple AABB collision detection for coins
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
        score = state.score + coins.filter(c => c.collected && !state.coins.find(sc => sc.id === c.id && sc.collected)).length;
      }
      
      const finalHero = { ...hero };

      return { ...state, hero: finalHero, platforms, coins, score };
    }
    default:
      return state;
  }
}


export function useGameLogic() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const leftPressed = useRef(false);
  const rightPressed = useRef(false);

  const gameTick = useCallback((gameArea: Size) => {
    dispatch({ type: 'GAME_TICK', payload: { gameArea } });
  }, []);

  // Wrapped dispatch to handle start/stop logic if needed, though direct dispatch is fine.
  const handleGameAction = useCallback((action: GameAction) => {
    dispatch(action);
  }, []);
  
  return { gameState, dispatch: handleGameAction, gameTick };
}

