
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
    PLATFORM_DEFAULT_WIDTH
} from '@/lib/gameTypes'; 

// Game constants
const GRAVITY_ACCELERATION = 0.4; 
const MAX_FALL_SPEED = -8; 
const HERO_BASE_SPEED = 3.0; 
const PLATFORM_GENERAL_SPEED = 1.0; 

// Target jump height in pixels
const TARGET_JUMP_HEIGHT_PX = 180; 
// Calculate JUMP_STRENGTH based on TARGET_JUMP_HEIGHT_PX and GRAVITY_ACCELERATION
// Formula derived from H = V^2 / (2G) + V / 2  => V^2 + GV - 2GH = 0
// V = (-G + sqrt(G^2 + 8GH)) / 2
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

// Platform Y offsets and calculated positions
const PLATFORM1_Y_OFFSET = 150; 
const PLATFORM2_Y_OFFSET = 270; 

const PLATFORM1_Y = PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS + PLATFORM1_Y_OFFSET;
const PLATFORM2_Y = PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS + PLATFORM2_Y_OFFSET;

// Initial static properties for level 1 platforms
const INITIAL_PLATFORM1_X_PERCENT = 0.2; // 20% of game width
const INITIAL_PLATFORM1_SPEED = PLATFORM_GENERAL_SPEED;

const INITIAL_PLATFORM2_X_PERCENT = 0.6; // 60% of game width
const INITIAL_PLATFORM2_SPEED = PLATFORM_GENERAL_SPEED;


const getLevel1Platforms = (gameAreaWidth: number): PlatformType[] => [
  {
    id: 'platform_ground', x: -100, y: PLATFORM_GROUND_Y, 
    width: gameAreaWidth + 200, height: PLATFORM_GROUND_THICKNESS, 
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: gameAreaWidth * INITIAL_PLATFORM1_X_PERCENT, y: PLATFORM1_Y, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT, 
    color: 'hsl(var(--platform-color))', isMoving: true, speed: INITIAL_PLATFORM1_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH } 
  },
  {
    id: 'platform2', x: gameAreaWidth * INITIAL_PLATFORM2_X_PERCENT, y: PLATFORM2_Y, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: INITIAL_PLATFORM2_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH } 
  },
];

function generateCoins(count: number, gameArea: Size, coinSize: number): CoinType[] {
  const coins: CoinType[] = [];
  
  const groundTopY = PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS; 

  // Game area height is measured from top (0) to bottom (gameArea.height)
  // Coin zone top is COIN_ZONE_TOP_OFFSET from game area top.
  // Coin zone bottom is COIN_ZONE_BOTTOM_OFFSET from game area top.
  // Y coordinates for game objects are from bottom of game area.
  // So, we need to convert these.
  const coinZoneTopEdgeGameCoords = gameArea.height - COIN_ZONE_TOP_OFFSET - coinSize; // Highest Y for a coin's bottom
  const coinZoneBottomEdgeGameCoords = gameArea.height - COIN_ZONE_BOTTOM_OFFSET; // Lowest Y for a coin's bottom

  // Ensure spawn zone is above ground
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
    });
  }
  return coins;
}


const initialGameState: GameState = {
  hero: { ...initialHeroState },
  platforms: getLevel1Platforms(800), // Initial default width
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

      // Ensure ground platform Y is always PLATFORM_GROUND_Y and its width adapts
      platforms = state.platforms.map(p => {
        if (p.id === 'platform_ground') {
            return {...p, width: newEffectiveGameArea.width + 200, x: -100, y: PLATFORM_GROUND_Y, height: PLATFORM_GROUND_THICKNESS }; 
        }
        // For moving platforms, update their moveRange based on the new game area width
        if (p.isMoving && p.moveAxis === 'x') {
          return { ...p, 
            x: Math.min(p.x, newEffectiveGameArea.width - p.width), // Adjust x if out of new bounds
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
            if (platformNewX <= p.moveRange.min || platformNewX + p.width >= p.moveRange.max + p.width ) { // Corrected boundary condition
               p.direction *= -1; 
               platformVelX *= -1; // Ensure velocity reflects new direction for this tick
               // Clamp position to avoid overshooting significantly in one frame
               platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max));
            }
          }
          return { ...p, x: platformNewX, velocity: { x: platformVelX, y: 0 } };
        }
        return { ...p, velocity: {x: 0, y: 0}}; // Ensure non-moving platforms have 0 velocity
      });

      if (state.heroAppearance === 'appearing') {
        nextHeroAppearElapsedTime += (1000 / 60); // Assuming 60 FPS for delta time
        if (nextHeroAppearElapsedTime >= HERO_APPEARANCE_DURATION_MS) {
          nextHeroAppearance = 'visible';
          nextHeroAppearElapsedTime = HERO_APPEARANCE_DURATION_MS;
          nextHero.action = 'idle'; // Ensure idle state after appearing
        }
        // Keep hero static during appearance
        nextHero.velocity = { x: 0, y: 0 };
        nextHero.currentSpeedX = 0;

      } else { // Hero is visible and game logic applies
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
        
        // Determine hero action based on movement
        if (newVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down'; // Threshold to show falling
        else if (newVelY > 0) nextHero.action = 'jump_up';
        else if (nextHero.currentSpeedX !== 0 && nextHero.isOnPlatform) nextHero.action = nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left';
        else if (nextHero.isOnPlatform) nextHero.action = 'idle'; // Idle if on platform and not moving/jumping/falling

        // Collision detection and resolution
        let resolvedOnPlatform = false;
        let resolvedPlatformId = null;
        let finalVelY = newVelY; // finalVelY to be updated based on collision

        const heroOldBottom = nextHero.y; // For landing detection

        for (const platform of nextPlatforms) {
          const heroLeft = newPosX;
          const heroRight = newPosX + nextHero.width;
          const heroProjectedBottom = newPosY; // Where hero's bottom will be if no collision
          const heroProjectedTop = newPosY + nextHero.height; // Where hero's top will be

          const platformTopSurface = platform.y + platform.height;
          const platformBottomSurface = platform.y;
          const platformLeft = platform.x;
          const platformRight = platform.x + platform.width;
          
          const horizontalOverlap = heroLeft < platformRight && heroRight > platformLeft;

          // Check for landing on a platform
          if (horizontalOverlap) {
            // Landing condition: hero moving down, was above platform, will be on or below platform top
            if (finalVelY <= 0 &&  // Moving downwards or stationary vertically
                heroOldBottom >= platformTopSurface && // Old bottom was at or above platform top
                heroProjectedBottom <= platformTopSurface) { // New bottom is at or below platform top
              newPosY = platformTopSurface; // Snap to platform top
              finalVelY = 0;          // Stop vertical movement
              resolvedOnPlatform = true;
              resolvedPlatformId = platform.id;
              // Update action if landing from jump/fall
              if (nextHero.action === 'fall_down' || nextHero.action === 'jump_up') { 
                 nextHero.action = nextHero.currentSpeedX !==0 ? (nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left') : 'idle';
              }
              break; // Collision resolved for this tick
            }
            
            // Check for hitting platform from below (head bump)
            const heroOldTop = nextHero.y + nextHero.height; // For head bump detection
            if (finalVelY > 0 && // Moving upwards
                heroOldTop <= platformBottomSurface && // Old top was at or below platform bottom
                heroProjectedTop >= platformBottomSurface) { // New top is at or above platform bottom
               newPosY = platformBottomSurface - nextHero.height; // Snap below platform
               finalVelY = -GRAVITY_ACCELERATION * 0.5; // Start falling immediately
            }
          }
        }
        
        // Update hero position and velocity
        nextHero.x = newPosX;
        nextHero.y = newPosY;
        nextHero.velocity = { x: (nextHero.velocity?.x ?? 0), y: finalVelY }; // Keep horizontal velocity if any, update vertical
        nextHero.isOnPlatform = resolvedOnPlatform;
        nextHero.platformId = resolvedPlatformId;

        // Refine action based on final state for the tick
        if (nextHero.isOnPlatform) {
          if (nextHero.currentSpeedX === 0 && finalVelY === 0) nextHero.action = 'idle';
          else if (nextHero.currentSpeedX !== 0 && finalVelY === 0) nextHero.action = nextHero.currentSpeedX > 0 ? 'run_right' : 'run_left';
        } else { // Not on platform
          if (finalVelY > 0) nextHero.action = 'jump_up';
          else if (finalVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down';
          // If somehow not on platform but not moving vertically significantly, could be edge case or start of fall
        }


        // Boundary checks for game area (horizontal)
        if (nextHero.x < 0) nextHero.x = 0;
        if (nextHero.x + nextHero.width > gameArea.width) nextHero.x = gameArea.width - nextHero.width;
        
        // Handle falling off the bottom of the screen (reset)
        if (nextHero.y < 0) { // If hero falls below y=0 (absolute bottom)
          const resetHeroState = {
              ...initialHeroState, 
              x: gameArea.width / 2 - initialHeroState.width / 2, // Center hero
              y: PLATFORM_GROUND_Y + PLATFORM_GROUND_THICKNESS, // On ground platform
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
              coins: generateCoins(NUM_COINS, gameArea, COIN_SIZE), // Regenerate coins
              score: 0, // Reset score
              gameOver: false, // Reset game over state
              heroAppearance: 'appearing', // Trigger hero appearance animation again
              heroAppearElapsedTime: 0,
           }; 
        }

        // Coin collection
        let collectedSomething = false;
        nextCoins = nextCoins.map(coin => {
          if (!coin.collected) {
            // Basic AABB collision check for coins
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
      } // End of hero visible logic
      
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
  
  // Initialize game on first valid game area update or if game is not initialized
  useEffect(() => {
    if (gameState.gameArea.width > 0 && gameState.gameArea.height > 0 && !gameState.isGameInitialized) {
      // This will trigger the initialization logic within the UPDATE_GAME_AREA case
      // if it hasn't run yet due to initial gameArea being 0,0.
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

