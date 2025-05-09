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

const initialHeroState: HeroType = {
  id: 'hero',
  x: 50,
  y: PLATFORM_DEFAULT_HEIGHT, // Start on an implicit ground or first platform
  width: HERO_WIDTH,
  height: HERO_HEIGHT,
  velocity: { x: 0, y: 0 },
  action: 'idle',
  isOnPlatform: false,
  platformId: null,
  currentSpeedX: 0,
};

const level1Platforms: PlatformType[] = [
  {
    id: 'platform_ground', x: 0, y: 0, width: 10000, height: PLATFORM_DEFAULT_HEIGHT, // Effectively a wide ground
    color: 'hsl(var(--platform-color))', isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
  },
  {
    id: 'platform1', x: 100, y: 200, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: 1, moveAxis: 'x',
    moveRange: { min: 50, max: 400 } // Example range, needs gameArea width
  },
  {
    id: 'platform2', x: 300, y: 320, width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_DEFAULT_HEIGHT,
    color: 'hsl(var(--platform-color))', isMoving: true, speed: PLATFORM_SPEED, direction: -1, moveAxis: 'x',
    moveRange: { min: 200, max: 500} // Example range
  },
];

const level1Coins: CoinType[] = [
  { id: 'coin1', x: 150, y: 250, width: COIN_SIZE, height: COIN_SIZE, color: 'hsl(var(--coin-color))', collected: false },
  { id: 'coin2', x: 350, y: 370, width: COIN_SIZE, height: COIN_SIZE, color: 'hsl(var(--coin-color))', collected: false },
  { id: 'coin3', x: 50, y: 80, width: COIN_SIZE, height: COIN_SIZE, color: 'hsl(var(--coin-color))', collected: false },
];

const initialGameState: GameState = {
  hero: { ...initialHeroState },
  platforms: level1Platforms,
  coins: level1Coins,
  score: 0,
  currentLevel: 1,
  gameOver: false,
  gameArea: { width: 800, height: 600 }, // Default, will be updated
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_LEFT_START':
      return { ...state, hero: { ...state.hero, currentSpeedX: -HERO_BASE_SPEED, action: 'run_left' } };
    case 'MOVE_LEFT_STOP':
      return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX < 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && !state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
    case 'MOVE_RIGHT_START':
      return { ...state, hero: { ...state.hero, currentSpeedX: HERO_BASE_SPEED, action: 'run_right' } };
    case 'MOVE_RIGHT_STOP':
      return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX > 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && !state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
    case 'JUMP':
      if (state.hero.isOnPlatform) {
        return { ...state, hero: { ...state.hero, velocity: { ...state.hero.velocity!, y: JUMP_VELOCITY }, isOnPlatform: false, platformId: null, action: 'jump_up' } };
      }
      return state;
    case 'UPDATE_GAME_AREA':
      // Update platform move ranges based on new game area width
      const updatedPlatforms = state.platforms.map(p => {
        if (p.id === 'platform_ground') return {...p, width: action.payload.width + 200, x: -100 }; // Ensure ground covers entire area
        if (p.isMoving && p.moveAxis === 'x') {
          return { ...p, moveRange: { min: 0, max: action.payload.width - p.width } };
        }
        return p;
      });
      return { ...state, gameArea: action.payload, platforms: updatedPlatforms };
    case 'GAME_TICK': {
      let { hero, platforms, coins, score } = { ...state };
      const gameArea = action.payload.gameArea;

      // Update hero velocity and position
      let newVelY = (hero.velocity?.y ?? 0) + GRAVITY;
      newVelY = Math.min(newVelY, MAX_FALL_SPEED); // Terminal velocity

      let newPosX = hero.x + hero.currentSpeedX + (hero.isOnPlatform ? (platforms.find(p => p.id === hero.platformId)?.velocity?.x ?? 0) : (hero.velocity?.x ?? 0));
      let newPosY = hero.y + newVelY;

      hero = { ...hero, velocity: { x: hero.velocity?.x ?? 0, y: newVelY } };
      
      // Update hero action based on velocity
      if (newVelY > GRAVITY * 2) hero.action = 'fall_down'; // threshold to distinguish from peak of jump
      else if (newVelY < 0) hero.action = 'jump_up';
      else if (hero.currentSpeedX !== 0 && hero.isOnPlatform) hero.action = hero.currentSpeedX > 0 ? 'run_right' : 'run_left';
      else if (hero.isOnPlatform) hero.action = 'idle';


      // Platform movement
      platforms = platforms.map(p => {
        if (p.isMoving && p.id !== 'platform_ground') {
          let platformNewX = p.x;
          let platformNewVelX = p.speed * p.direction;
          if (p.moveAxis === 'x' && p.moveRange) {
            platformNewX += platformNewVelX;
            if (platformNewX <= p.moveRange.min || platformNewX >= p.moveRange.max) {
              platformNewVelX *= -1; // Reverse direction
              p.direction *= -1;
              platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max)); // Clamp
            }
          }
          return { ...p, x: platformNewX, velocity: { x: platformNewVelX, y:0 } };
        }
        return p;
      });
      
      // Collision detection and resolution
      hero.isOnPlatform = false;
      hero.platformId = null;

      for (const platform of platforms) {
        // Check for landing on platform
        const heroBottom = newPosY;
        const heroTop = newPosY + hero.height;
        const heroLeft = newPosX;
        const heroRight = newPosX + hero.width;

        const platformTop = platform.y + platform.height;
        const platformBottom = platform.y;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        // Are we horizontally aligned?
        const horizontalOverlap = heroLeft < platformRight && heroRight > platformLeft;

        if (horizontalOverlap) {
           // Was hero above platform in previous frame and now intersecting or on top?
          const prevHeroBottom = hero.y;
          if (prevHeroBottom >= platformTop && heroBottom <= platformTop && (hero.velocity?.y ?? 0) >= 0) {
            newPosY = platformTop; // Align hero bottom with platform top
            hero.velocity = { ...hero.velocity!, y: 0 };
            hero.isOnPlatform = true;
            hero.platformId = platform.id;
            if (hero.action === 'fall_down' || hero.action === 'jump_up') {
               hero.action = hero.currentSpeedX !==0 ? (hero.currentSpeedX > 0 ? 'run_right' : 'run_left') : 'idle';
            }
            // If hero is on a moving platform, add platform's velocity
             if (platform.isMoving && platform.velocity) {
               newPosX += platform.velocity.x;
             }
            break; 
          }
          // Check collision with bottom of platform (hero hitting head)
          else if (prevHeroBottom < platformBottom && heroTop >= platformBottom && (hero.velocity?.y ?? 0) < 0 ) {
             newPosY = platformBottom - hero.height;
             hero.velocity = { ...hero.velocity!, y: 0 }; // Stop upward movement
          }
        }
      }
      
      // Update hero position finally
      hero.x = newPosX;
      hero.y = newPosY;


      // Boundary checks for hero against gameArea
      if (hero.x < 0) hero.x = 0;
      if (hero.x + hero.width > gameArea.width) hero.x = gameArea.width - hero.width;
      // if (hero.y < 0) { // Fell off bottom
      //   // Reset or game over
      //   // For now, just put back on ground
      //   hero.y = platforms.find(p => p.id === 'platform_ground')!.height;
      //   hero.isOnPlatform = true;
      //   hero.platformId = 'platform_ground';
      //   hero.velocity = {x:0, y:0};
      //   hero.action = 'idle';
      // }
      // If hero falls below the lowest platform (ground), consider it game over or reset.
      // For this simple version, let's reset to starting position if hero.y < -hero.height (well off screen)
      if (hero.y < -hero.height * 2) { // Fell far off screen
        return { ...initialGameState, gameArea: state.gameArea, platforms: state.platforms.map(p => p.id === 'platform_ground' ? {...p, width: state.gameArea.width + 200, x: -100} : p) }; // Reset but keep gameArea and updated platforms
      }


      // Coin collection
      coins = coins.map(coin => {
        if (!coin.collected) {
          const heroMidX = hero.x + hero.width / 2;
          const heroMidY = hero.y + hero.height / 2;
          const coinMidX = coin.x + coin.width / 2;
          const coinMidY = coin.y + coin.height / 2;

          if (Math.abs(heroMidX - coinMidX) < (hero.width + coin.width) / 2 &&
              Math.abs(heroMidY - coinMidY) < (hero.height + coin.height) / 2) {
            score++;
            return { ...coin, collected: true };
          }
        }
        return coin;
      });
      
      // Ensure hero object reference is new if changed
      const finalHero = { ...hero };

      return { ...state, hero: finalHero, platforms, coins, score };
    }
    default:
      return state;
  }
}


export function useGameLogic() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  // Refs for pressed keys to handle continuous movement correctly
  const leftPressed = useRef(false);
  const rightPressed = useRef(false);

  const gameTick = useCallback((gameArea: Size) => {
    dispatch({ type: 'GAME_TICK', payload: { gameArea } });
  }, []);

  const handleGameAction = useCallback((action: GameAction) => {
     // Special handling for start/stop continuous movement
    if (action.type === 'MOVE_LEFT_START') leftPressed.current = true;
    if (action.type === 'MOVE_LEFT_STOP') leftPressed.current = false;
    if (action.type === 'MOVE_RIGHT_START') rightPressed.current = true;
    if (action.type === 'MOVE_RIGHT_STOP') rightPressed.current = false;
    
    dispatch(action);
  }, []);
  
  // This effect could potentially manage the currentSpeedX based on refs,
  // but direct dispatch might be simpler for now.
  // useEffect(() => {
  //   let newSpeedX = 0;
  //   if (leftPressed.current && !rightPressed.current) newSpeedX = -HERO_BASE_SPEED;
  //   if (rightPressed.current && !leftPressed.current) newSpeedX = HERO_BASE_SPEED;
  //   if (gameState.hero.currentSpeedX !== newSpeedX) {
  //     dispatch({ type: 'UPDATE_HERO_SPEED_X', payload: newSpeedX });
  //   }
  // }, []); // This needs careful dependency management to avoid infinite loops.

  return { gameState, dispatch: handleGameAction, gameTick };
}

