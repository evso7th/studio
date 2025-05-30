
// @ts-nocheck
"use client";

import type { Reducer} from 'react';
import { useReducer, useCallback, useEffect, useRef } from 'react'; 
import type { GameState, GameAction, HeroType, PlatformType, CoinType, Size } from '@/lib/gameTypes'; 
import { 
    HERO_APPEARANCE_DURATION_MS, 
    PLATFORM_GROUND_Y_FROM_BOTTOM_OFFSET, 
    PLATFORM_GROUND_THICKNESS, 
    HERO_WIDTH,
    HERO_HEIGHT, 
    COIN_SIZE,
    PLATFORM_NON_GROUND_HEIGHT,
    PLATFORM_DEFAULT_WIDTH,
    TARGET_JUMP_HEIGHT_PX,
    PLATFORM1_Y_OFFSET, 
    PLATFORM2_Y_OFFSET, 
    INITIAL_PLATFORM_SPEED,
    INITIAL_PLATFORM1_X_PERCENT,
    INITIAL_PLATFORM2_X_PERCENT,
    COIN_EXPLOSION_DURATION_MS,
    TOTAL_COINS_PER_LEVEL,
    COIN_SPAWN_EXPLOSION_DURATION_MS,
    MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR,
    MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR,
    MAX_COIN_SPAWN_Y_FROM_CONTROL_PANEL_TOP,
    COIN_SPAWN_DELAY_MS,
    HERO_BASE_SPEED,
    SLIPPERY_FRICTION_FACTOR,
    heroAnimationsConfig,
    ENEMY_WIDTH,
    ENEMY_HEIGHT,
    ENEMY_COLLISION_RADIUS,
    ENEMY_IMAGE_SRC_LVL2,
    ENEMY_IMAGE_SRC_LVL3_ENEMY1,
    ENEMY_IMAGE_SRC_LVL3_ENEMY2,
    ENEMY_DEFAULT_SPEED,
    ENEMY_DEFEAT_DURATION_MS, 
    ENEMY_FREEZE_DURATION_MS,
    ENEMY_PERIODIC_FREEZE_INTERVAL_MS,
    ENEMY2_LEVEL3_Y_OFFSET_FROM_PLATFORM2,
    ARMOR_DURATION_LEVEL_2,
    ARMOR_COOLDOWN_LEVEL_2,
    ARMOR_DURATION_LEVEL_3,
    ARMOR_COOLDOWN_LEVEL_3,
    PLATFORM_GRASS_SRC,
    PLATFORM_ICE_SRC,
    PLATFORM_STONE_SRC,
    GROUND_FLOOR_SRC,
    BACKGROUND_LEVEL1_SRC,
    BACKGROUND_LEVEL2_SRC,
    BACKGROUND_LEVEL3_SRC,
    LOWER_PLATFORM_Y_FROM_BOTTOM, 
} from '@/lib/gameTypes'; 
import { audioManager } from '@/lib/audioManager';

const GRAVITY_ACCELERATION = 0.4; 
const MAX_FALL_SPEED = -8; 


const JUMP_STRENGTH = (-GRAVITY_ACCELERATION + Math.sqrt(GRAVITY_ACCELERATION * GRAVITY_ACCELERATION + 8 * GRAVITY_ACCELERATION * TARGET_JUMP_HEIGHT_PX)) / 2;

export const calculatePlatformGroundY = (gameAreaHeight: number) => {
  return PLATFORM_GROUND_Y_FROM_BOTTOM_OFFSET;
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
  slideVelocityX: 0,
  isArmored: false,
  armorTimer: 0,
  armorCooldownTimer: 0,
  armorRemainingTime: 0,
};

const getLevelPlatforms = (gameAreaWidth: number, gameAreaHeight: number, level: number): PlatformType[] => {
  const groundPlatformY = calculatePlatformGroundY(gameAreaHeight); 
  let platformSpeed = INITIAL_PLATFORM_SPEED;
  let isPlatform1Slippery = false;
  let isPlatform2Slippery = false;
  let platform1ImageSrc = PLATFORM_GRASS_SRC;
  let platform2ImageSrc = PLATFORM_GRASS_SRC;
  let groundPlatformImageSrc = GROUND_FLOOR_SRC;

  if (level === 1) {
    platform1ImageSrc = PLATFORM_GRASS_SRC; 
    platform2ImageSrc = PLATFORM_GRASS_SRC;
    groundPlatformImageSrc = GROUND_FLOOR_SRC;
  } else if (level === 2) {
    platformSpeed = 0.75;
    isPlatform1Slippery = true;
    isPlatform2Slippery = true;
    platform1ImageSrc = PLATFORM_ICE_SRC;
    platform2ImageSrc = PLATFORM_ICE_SRC;
    groundPlatformImageSrc = PLATFORM_ICE_SRC;
  } else if (level === 3) {
    platformSpeed = 0.75; 
    isPlatform1Slippery = false; // Upper platform is not slippery
    isPlatform2Slippery = true; // Lower platform is slippery
    platform1ImageSrc = PLATFORM_STONE_SRC; // Upper platform
    platform2ImageSrc = PLATFORM_STONE_SRC; // Lower platform
    groundPlatformImageSrc = PLATFORM_STONE_SRC;
  }


  return [
    {
      id: 'platform_ground', x: -100, y: groundPlatformY, 
      width: gameAreaWidth + 200, height: PLATFORM_GROUND_THICKNESS, 
      isMoving: false, speed: 0, direction: 1, moveAxis: 'x',
      imageSrc: groundPlatformImageSrc,
    },
    { 
      id: 'platform1', // Upper platform
      x: gameAreaWidth * INITIAL_PLATFORM1_X_PERCENT - (INITIAL_PLATFORM1_X_PERCENT === 1.0 ? PLATFORM_DEFAULT_WIDTH: 0), 
      y: PLATFORM2_Y_OFFSET, // Use absolute Y offset for upper platform
      width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT, 
      isMoving: true, speed: platformSpeed, direction: INITIAL_PLATFORM1_X_PERCENT === 1.0 ? -1 : 1, 
      moveAxis: 'x',
      moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH },
      imageSrc: platform1ImageSrc,
      isSlippery: level === 3 ? true : isPlatform1Slippery, // Upper platform slippery on level 3
    },
    { 
      id: 'platform2', // Lower platform
      x: gameAreaWidth * INITIAL_PLATFORM2_X_PERCENT - (INITIAL_PLATFORM2_X_PERCENT === 1.0 ? PLATFORM_DEFAULT_WIDTH: 0), 
      y: PLATFORM1_Y_OFFSET, // Use absolute Y offset for lower platform
      width: PLATFORM_DEFAULT_WIDTH, height: PLATFORM_NON_GROUND_HEIGHT,
      isMoving: true, speed: platformSpeed, direction: INITIAL_PLATFORM2_X_PERCENT === 1.0 ? -1 : 1, 
      moveAxis: 'x',
      moveRange: { min: 0, max: gameAreaWidth - PLATFORM_DEFAULT_WIDTH },
      imageSrc: platform2ImageSrc,
      isSlippery: isPlatform2Slippery,
    },
  ];
};


const getLevelEnemies = (gameAreaWidth: number, gameAreaHeight: number, level: number, platforms: PlatformType[]): EnemyType[] => {
  const enemies: EnemyType[] = [];
  const platform1 = platforms.find(p => p.id === 'platform1');  // Upper
  const platform2 = platforms.find(p => p.id === 'platform2');  // Lower

  // Calculate Y position for enemy1 (between platforms or on lower if upper doesn't exist)
  let enemy1YPosition = gameAreaHeight / 2 - ENEMY_HEIGHT / 2; // Default if no platforms
  if (platform1 && platform2) {
      const lowerPlatformTop = platform2.y + platform2.height;
      const upperPlatformBottom = platform1.y;
      enemy1YPosition = lowerPlatformTop + (upperPlatformBottom - lowerPlatformTop) / 2 - ENEMY_HEIGHT / 2;
  } else if (platform2) { // Only lower platform exists
      enemy1YPosition = platform2.y + platform2.height + 20; // Adjust as needed
  }


  if (level === 2) {
    enemies.push({
      id: `enemy_level2_0`,
      enemyId: 'enemy1', 
      x: gameAreaWidth / 2 - ENEMY_WIDTH / 2, 
      y: enemy1YPosition,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      imageSrc: ENEMY_IMAGE_SRC_LVL2,
      speed: ENEMY_DEFAULT_SPEED, 
      direction: 1,
      moveAxis: 'x',
      moveRange: { min: 0, max: gameAreaWidth - ENEMY_WIDTH },
      collisionRadius: ENEMY_COLLISION_RADIUS,
      isDefeated: false, 
      defeatTimer: 0,
      isFrozen: false,
      frozenTimer: 0,
      periodicFreezeIntervalTimer: ENEMY_PERIODIC_FREEZE_INTERVAL_MS,
    });
  } else if (level === 3) {
    enemies.push({
      id: `enemy_level3_0`, // First enemy on level 3
      enemyId: 'enemy1',
      x: gameAreaWidth / 3 - ENEMY_WIDTH / 2, 
      y: enemy1YPosition, 
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      imageSrc: ENEMY_IMAGE_SRC_LVL3_ENEMY1,
      speed: ENEMY_DEFAULT_SPEED, 
      direction: 1,
      moveAxis: 'x',
      moveRange: { min: 0, max: gameAreaWidth - ENEMY_WIDTH },
      collisionRadius: ENEMY_COLLISION_RADIUS,
      isDefeated: false, 
      defeatTimer: 0,
      isFrozen: false,
      frozenTimer: 0,
      periodicFreezeIntervalTimer: ENEMY_PERIODIC_FREEZE_INTERVAL_MS,
    });

    if (platform1) { // Second enemy appears above the upper platform
      const enemy2YPosition = platform1.y + platform1.height + ENEMY2_LEVEL3_Y_OFFSET_FROM_PLATFORM2; 
      enemies.push({
        id: `enemy_level3_1`, // Second enemy on level 3
        enemyId: 'enemy2',
        x: (gameAreaWidth * 2 / 3) - ENEMY_WIDTH / 2, 
        y: enemy2YPosition,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        imageSrc: ENEMY_IMAGE_SRC_LVL3_ENEMY2,
        speed: ENEMY_DEFAULT_SPEED, 
        direction: -1, 
        moveAxis: 'x',
        moveRange: { min: 0, max: gameAreaWidth - ENEMY_WIDTH },
        collisionRadius: ENEMY_COLLISION_RADIUS,
        isDefeated: false, 
        defeatTimer: 0,
        isFrozen: false,
        frozenTimer: 0,
        periodicFreezeIntervalTimer: ENEMY_PERIODIC_FREEZE_INTERVAL_MS,
      });
    }
  }
  return enemies; 
};


function spawnNextCoinPair(gameArea: Size, coinSize: number, currentPairId: number, platforms: PlatformType[]): CoinType[] {
  if (!gameArea.width || !gameArea.height || platforms.length === 0) return []; 
  
  const newPair: CoinType[] = [];
  
  const groundPlatformY = calculatePlatformGroundY(gameArea.height); 

  const effectiveMinSpawnY = LOWER_PLATFORM_Y_FROM_BOTTOM; // Bottom of the coin zone

  // Top of the coin zone, 550px from the top of the control panel
  // Control panel top is gameArea.height (since y=0 is bottom of game area)
  // So, top of coin zone from game bottom = gameArea.height - MAX_COIN_SPAWN_Y_FROM_CONTROL_PANEL_TOP
  let effectiveMaxSpawnY = gameArea.height - MAX_COIN_SPAWN_Y_FROM_CONTROL_PANEL_TOP; 
  effectiveMaxSpawnY = Math.max(effectiveMinSpawnY + coinSize, effectiveMaxSpawnY); // Ensure max is not below min

  if (effectiveMinSpawnY >= effectiveMaxSpawnY) {
    // Fallback if calculated zone is invalid
    effectiveMaxSpawnY = effectiveMinSpawnY + coinSize * 2; 
    if (effectiveMaxSpawnY > gameArea.height - coinSize) {
        effectiveMaxSpawnY = gameArea.height - coinSize;
    }
    if (effectiveMinSpawnY > effectiveMaxSpawnY - coinSize) {
        effectiveMinSpawnY = effectiveMaxSpawnY - coinSize * 2;
        if (effectiveMinSpawnY < 0) effectiveMinSpawnY = 0;
    }
  }
  
  const yRandomFactorRange = Math.max(0, effectiveMaxSpawnY - effectiveMinSpawnY - coinSize);
  
  const minDistanceX = gameArea.width * MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR;
  const minDistanceY = Math.max(20, gameArea.height * MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR); 

  const x1 = Math.random() * (gameArea.width - coinSize);
  const y1 = effectiveMinSpawnY + (yRandomFactorRange > 0 ? (Math.random() * yRandomFactorRange) : 0);
  newPair.push({
    id: `coin_p${currentPairId}_0_${Date.now()}`,
    x: x1, y: y1, width: coinSize, height: coinSize,
    collected: false, isExploding: false, explosionProgress: 0,
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
    collected: false, isExploding: false, explosionProgress: 0,
    isSpawning: false, 
    spawnExplosionProgress: 0, 
    pairId: currentPairId,
    isPendingSpawn: true,
    spawnDelayMs: COIN_SPAWN_DELAY_MS,
  });

  return newPair;
}


export const getDefaultInitialGameState = (gameAreaWidth = 800, gameAreaHeight = 600, level = 1): GameState => {
  const groundPlatformY = calculatePlatformGroundY(gameAreaHeight);
  const platforms = getLevelPlatforms(gameAreaWidth, gameAreaHeight, level);
  const enemies = getLevelEnemies(gameAreaWidth, gameAreaHeight, level, platforms); 
  
  let heroSpeed = HERO_BASE_SPEED;
  let platformSpeed = INITIAL_PLATFORM_SPEED;

  if (level === 2 || level === 3) {
    platformSpeed = 0.75;
  }
  
  const updatedPlatforms = platforms.map(p => {
    if (p.isMoving) {
      return { ...p, speed: platformSpeed };
    }
    return p;
  });

  const initialArmorTimer = level === 2 ? ARMOR_DURATION_LEVEL_2 : (level === 3 ? ARMOR_DURATION_LEVEL_3 : 0);

  return {
    hero: {
      ...initialHeroState,
      x: gameAreaWidth / 2 - initialHeroState.width / 2,
      y: groundPlatformY + PLATFORM_GROUND_THICKNESS, 
      currentSpeedX: 0, 
      isArmored: level === 2 || level === 3, 
      armorTimer: initialArmorTimer,
      armorCooldownTimer: 0,
      armorRemainingTime: Math.ceil(initialArmorTimer / 1000),
    },
    platforms: updatedPlatforms,
    activeCoins: spawnNextCoinPair({ width: gameAreaWidth, height: gameAreaHeight }, COIN_SIZE, 0, updatedPlatforms),
    enemies: enemies,
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
    showDebugLevelComplete: false,
    showDebugFinalScreen: false,
    bearVoicePlayedForLevel: false,
    soundToPlay: null,
  };
};

let initialGameState = getDefaultInitialGameState(undefined, undefined, 1);


export function gameReducer(state: GameState, action: GameAction): GameState {
  let soundToPlay: string | null = null;

  switch (action.type) {
    case 'MOVE_LEFT_START':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost && !state.gameOver) {
        const currentHeroSpeed = HERO_BASE_SPEED;
        return { ...state, hero: { ...state.hero, currentSpeedX: -currentHeroSpeed, action: 'run_left', facingDirection: 'left', slideVelocityX: 0 } };
      }
      return state;
    case 'MOVE_LEFT_STOP':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost && !state.gameOver) {
        return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX < 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
      }
      return state;
    case 'MOVE_RIGHT_START':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost && !state.gameOver) {
         const currentHeroSpeed = HERO_BASE_SPEED;
        return { ...state, hero: { ...state.hero, currentSpeedX: currentHeroSpeed, action: 'run_right', facingDirection: 'right', slideVelocityX: 0 } };
      }
      return state;
    case 'MOVE_RIGHT_STOP':
      if (state.heroAppearance === 'visible' && !state.levelCompleteScreenActive && !state.gameLost && !state.gameOver) {
        return { ...state, hero: { ...state.hero, currentSpeedX: state.hero.currentSpeedX > 0 ? 0 : state.hero.currentSpeedX, action: state.hero.currentSpeedX === 0 && state.hero.isOnPlatform && (state.hero.velocity?.y ?? 0) === 0 ? 'idle' : state.hero.action } };
      }
      return state;
    case 'JUMP':
      if (state.heroAppearance === 'visible' && state.hero.isOnPlatform && !state.levelCompleteScreenActive && !state.gameLost && !state.gameOver) {
        soundToPlay = 'Hero_jump1';
        return { ...state, soundToPlay, hero: { ...state.hero, velocity: { ...state.hero.velocity!, y: JUMP_STRENGTH }, isOnPlatform: false, platformId: null, action: 'jump_up' } };
      }
      return state;
    case 'UPDATE_GAME_AREA': {
      const { width, height, paddingTop } = action.payload;
      if (width <= 0 || height <= 0) return state;

      const currentLevel = state.isGameInitialized ? state.currentLevel : (initialGameState.currentLevel || 1);
      const newPlatforms = getLevelPlatforms(width, height, currentLevel);
      const newEnemies = getLevelEnemies(width, height, currentLevel, newPlatforms);
      
      let newHeroState = state.hero;
      if (!state.isGameInitialized) {
          newHeroState = {
            ...initialHeroState,
            x: width / 2 - initialHeroState.width / 2,
            y: calculatePlatformGroundY(height) + PLATFORM_GROUND_THICKNESS,
            isArmored: currentLevel === 2 || currentLevel === 3,
            armorTimer: currentLevel === 2 ? ARMOR_DURATION_LEVEL_2 : (currentLevel === 3 ? ARMOR_DURATION_LEVEL_3 : 0),
            armorRemainingTime: Math.ceil((currentLevel === 2 ? ARMOR_DURATION_LEVEL_2 : (currentLevel === 3 ? ARMOR_DURATION_LEVEL_3 : 0)) / 1000),
          };
      } else {
          newHeroState = {
            ...state.hero,
            x: width / 2 - state.hero.width / 2, 
            y: calculatePlatformGroundY(height) + PLATFORM_GROUND_THICKNESS, 
            action: 'idle',
            velocity: { x:0, y:0 },
            isOnPlatform: true,
            platformId: 'platform_ground',
            isArmored: state.hero.isArmored,
            armorTimer: state.hero.armorTimer,
            armorCooldownTimer: state.hero.armorCooldownTimer,
            armorRemainingTime: state.hero.armorRemainingTime,
          };
      }
      
      let newActiveCoins = state.activeCoins;
      if (!state.isGameInitialized || state.gameArea.width !== width || state.gameArea.height !== height) {
        newActiveCoins = spawnNextCoinPair({ width, height }, COIN_SIZE, 0, newPlatforms);
      }

      return {
        ...state,
        gameArea: { width, height },
        paddingTop,
        hero: newHeroState,
        platforms: newPlatforms,
        enemies: newEnemies,
        activeCoins: newActiveCoins,
        score: state.isGameInitialized ? state.score : 0,
        totalCoinsCollectedInLevel: state.isGameInitialized ? state.totalCoinsCollectedInLevel : 0,
        currentPairIndex: state.isGameInitialized ? state.currentPairIndex : 0,
        isGameInitialized: true,
        bearVoicePlayedForLevel: state.isGameInitialized ? state.bearVoicePlayedForLevel : false,
        heroAppearance: state.isGameInitialized ? 'visible' : 'appearing',
        heroAppearElapsedTime: state.isGameInitialized ? HERO_APPEARANCE_DURATION_MS : 0,
        soundToPlay: null, 
      };
    }
     case 'RESTART_LEVEL': {
      const { width, height } = state.gameArea;
      const newState = getDefaultInitialGameState(width, height, state.currentLevel); 
      return {
        ...newState,
        isGameInitialized: true,
        paddingTop: state.paddingTop,
        levelCompleteScreenActive: false,
        gameOver: false, 
        bearVoicePlayedForLevel: false,
        soundToPlay: null, 
      };
    }
    case 'NEXT_LEVEL': {
      const nextLevel = state.currentLevel + 1;
      if (nextLevel > 3) { 
         soundToPlay = 'final_screen';
         return {
          ...state, 
          gameOver: true, 
          levelCompleteScreenActive: false, 
          soundToPlay,
        };
      }
      const { width, height } = state.gameArea;
      const newState = getDefaultInitialGameState(width, height, nextLevel);
      return {
        ...newState,
        isGameInitialized: true,
        paddingTop: state.paddingTop,
        levelCompleteScreenActive: false,
        gameOver: false,
        bearVoicePlayedForLevel: false,
        soundToPlay: 'New_level', 
      };
    }
    case 'GAME_WON': 
      soundToPlay = 'final_screen';
      return {
        ...state,
        gameOver: true,
        levelCompleteScreenActive: false,
        soundToPlay,
      };
    case 'SET_DEBUG_LEVEL_COMPLETE': { 
      return {
        ...state,
        levelCompleteScreenActive: action.payload,
        showDebugLevelComplete: action.payload,
        soundToPlay: action.payload ? 'New_level' : null,
      };
    }
    case 'SET_DEBUG_LEVEL': {
        const { width, height } = state.gameArea;
        const newState = getDefaultInitialGameState(width, height, action.payload);
        initialGameState = newState; 
        return {
          ...newState,
          isGameInitialized: true,
          paddingTop: state.paddingTop,
          levelCompleteScreenActive: false,
          gameOver: false,
          bearVoicePlayedForLevel: false,
          soundToPlay: 'New_level',
        };
    }
    case 'GAME_TICK': {
      if (!state.isGameInitialized || state.levelCompleteScreenActive || state.gameLost || state.gameOver) return state;
      const { deltaTime } = action.payload;

      let { hero: heroState, platforms: currentPlatforms, activeCoins: currentActiveCoins, enemies: currentEnemies, score: currentScore, totalCoinsCollectedInLevel: currentTotalCollected, currentPairIndex: currentPairIdx, bearVoicePlayedForLevel: currentBearVoicePlayed } = state;
      const gameArea = state.gameArea;
      let nextHeroAppearance = state.heroAppearance;
      let nextHeroAppearElapsedTime = state.heroAppearElapsedTime;

      let nextPlatforms = currentPlatforms.map(p => ({ ...p }));
      let nextHero = { ...heroState, velocity: { ...heroState.velocity }, animations: { ...heroState.animations} }; 
      let nextActiveCoins = currentActiveCoins.map(c => ({ ...c }));
      let nextEnemies = [...currentEnemies.map(e => ({ ...e }))];
      let nextScore = currentScore;
      let nextTotalCollected = currentTotalCollected;
      let nextPairIdx = currentPairIdx;
      let levelCompleteThisTick = false; 
      let gameLostThisTick = false;
      let heroHitByEnemy = false;
      let nextBearVoicePlayed = currentBearVoicePlayed;
      let playCoinSplashSound = false;
      let tickSoundToPlay: string | null = null;


      // Armor logic
      if (state.currentLevel === 2 || state.currentLevel === 3) {
        if (nextHero.isArmored) {
          nextHero.armorTimer -= deltaTime;
          if (nextHero.armorTimer <= 0) {
            nextHero.isArmored = false;
            nextHero.armorTimer = 0;
            nextHero.armorCooldownTimer = state.currentLevel === 2 ? ARMOR_COOLDOWN_LEVEL_2 : ARMOR_COOLDOWN_LEVEL_3;
          }
        } else {
          nextHero.armorCooldownTimer -= deltaTime;
          if (nextHero.armorCooldownTimer <= 0) {
            nextHero.isArmored = true;
            nextHero.armorCooldownTimer = 0;
            nextHero.armorTimer = state.currentLevel === 2 ? ARMOR_DURATION_LEVEL_2 : ARMOR_DURATION_LEVEL_3;
          }
        }
        nextHero.armorRemainingTime = Math.ceil(nextHero.armorTimer / 1000);
      }


      const currentAnimationKey = nextHero.action === 'run_left' || nextHero.action === 'run_right' ? 'run' : (nextHero.action === 'jump_up' || nextHero.action === 'fall_down' ? 'jump' : 'idle');
      const currentAnimation = nextHero.animations[currentAnimationKey];
      
      nextHero.frameTime += deltaTime;
      if (currentAnimation && nextHero.frameTime >= 1000 / currentAnimation.fps) {
        nextHero.frameTime = 0;
        nextHero.currentFrame = (nextHero.currentFrame + 1) % currentAnimation.frames;
      }


      nextActiveCoins = nextActiveCoins.map(coin => {
        let updatedCoin = { ...coin };
        if (updatedCoin.isPendingSpawn && updatedCoin.spawnDelayMs !== undefined) {
          const newDelay = updatedCoin.spawnDelayMs - deltaTime;
          if (newDelay <= 0) {
            playCoinSplashSound = true;
            updatedCoin = {
              ...updatedCoin,
              isPendingSpawn: false,
              spawnDelayMs: 0,
              isSpawning: true,
              spawnExplosionProgress: 0,
            };
          } else {
            updatedCoin.spawnDelayMs = newDelay;
          }
        }
      
        if (updatedCoin.isSpawning) {
          const newProgress = (updatedCoin.spawnExplosionProgress || 0) + (deltaTime / COIN_SPAWN_EXPLOSION_DURATION_MS);
          if (newProgress >= 1) {
            updatedCoin.isSpawning = false;
            updatedCoin.spawnExplosionProgress = 1;
          } else {
            updatedCoin.spawnExplosionProgress = newProgress;
          }
        }
        return updatedCoin;
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
          const platformBaseSpeed = p.speed; 
          let platformVelX = platformBaseSpeed * p.direction;

          if (p.moveAxis === 'x' && p.moveRange) {
            platformNewX += platformVelX * (deltaTime / (1000/60)); 
            if (platformNewX <= p.moveRange.min || platformNewX + p.width >= p.moveRange.max + p.width ) { 
               p.direction *= -1; 
               platformVelX *= -1; 
               platformNewX = Math.max(p.moveRange.min, Math.min(platformNewX, p.moveRange.max));
            }
          }
           
           let platformNewY = p.y; // Keep original y for moving platforms if not ground
            if (p.id === 'platform1') platformNewY = PLATFORM2_Y_OFFSET; // Upper platform
            else if (p.id === 'platform2') platformNewY = PLATFORM1_Y_OFFSET; // Lower platform

          return { ...p, x: platformNewX, y: platformNewY, velocity: { x: platformVelX, y: 0 }, speed: platformBaseSpeed };
        }
        return { ...p, velocity: {x: 0, y: 0}}; 
      });

      nextEnemies = nextEnemies.map(enemy => {
        let updatedEnemy = { ...enemy };
        const previousEnemyState = state.enemies.find(e => e.id === enemy.id);


        if (updatedEnemy.isDefeated && updatedEnemy.defeatTimer !== undefined) {
          const newDefeatTimer = updatedEnemy.defeatTimer - deltaTime;
          if (newDefeatTimer <= 0) {
             updatedEnemy = {
                ...updatedEnemy,
                isDefeated: false,
                defeatTimer: 0,
                x: gameArea.width / 2 - updatedEnemy.width / 2, 
                y: updatedEnemy.y, 
                direction: 1, 
                isFrozen: false,
                frozenTimer: 0,
                periodicFreezeIntervalTimer: ENEMY_PERIODIC_FREEZE_INTERVAL_MS,
             };
             if (previousEnemyState && previousEnemyState.isDefeated && !updatedEnemy.isDefeated) {
                tickSoundToPlay = 'bear_voice'; 
             }
          } else {
             return { ...updatedEnemy, defeatTimer: newDefeatTimer };
          }
        }


        if (updatedEnemy.isFrozen && updatedEnemy.frozenTimer !== undefined) {
          const newFrozenTimer = updatedEnemy.frozenTimer - deltaTime;
          if (newFrozenTimer <= 0) {
            updatedEnemy = {
              ...updatedEnemy,
              isFrozen: false,
              frozenTimer: 0,
              periodicFreezeIntervalTimer: ENEMY_PERIODIC_FREEZE_INTERVAL_MS, 
            };
          } else {
            return { ...updatedEnemy, frozenTimer: newFrozenTimer };
          }
        }

        if (!updatedEnemy.isDefeated && !updatedEnemy.isFrozen && updatedEnemy.periodicFreezeIntervalTimer !== undefined) {
          const newPeriodicIntervalTimer = updatedEnemy.periodicFreezeIntervalTimer - deltaTime;
          if (newPeriodicIntervalTimer <= 0) {
            return { 
              ...updatedEnemy,
              isFrozen: true,
              frozenTimer: ENEMY_FREEZE_DURATION_MS,
              periodicFreezeIntervalTimer: ENEMY_PERIODIC_FREEZE_INTERVAL_MS, 
            };
          }
          updatedEnemy = { ...updatedEnemy, periodicFreezeIntervalTimer: newPeriodicIntervalTimer };
        }
        
        if (!updatedEnemy.isDefeated && !updatedEnemy.isFrozen) {
            let enemyNewX = updatedEnemy.x;
            const enemyBaseSpeed = updatedEnemy.speed;
            let enemyVelX = enemyBaseSpeed * updatedEnemy.direction;

            if (updatedEnemy.moveAxis === 'x' && updatedEnemy.moveRange) {
              enemyNewX += enemyVelX * (deltaTime / (1000 / 60));
              if (enemyNewX <= updatedEnemy.moveRange.min || enemyNewX + updatedEnemy.width >= updatedEnemy.moveRange.max + updatedEnemy.width) {
                const newDirection = updatedEnemy.direction * -1;
                enemyVelX *= -1;
                enemyNewX = Math.max(updatedEnemy.moveRange.min, Math.min(enemyNewX, updatedEnemy.moveRange.max));
                updatedEnemy = {...updatedEnemy, direction: newDirection}; 
              }
            }
            updatedEnemy = { ...updatedEnemy, x: enemyNewX, velocity: { x: enemyVelX, y: 0 }, speed: enemyBaseSpeed };
        }
        return updatedEnemy; 
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
        nextHero.slideVelocityX = 0;
      } else { 
        let newVelY = (nextHero.velocity?.y ?? 0) - GRAVITY_ACCELERATION * (deltaTime / (1000/60));
        newVelY = Math.max(newVelY, MAX_FALL_SPEED);

        let platformMovementEffectX = 0;
        let onSlipperyPlatform = false;
        if (nextHero.isOnPlatform && nextHero.platformId) {
          const currentPlatformInstance = nextPlatforms.find(p => p.id === nextHero.platformId);
          if (currentPlatformInstance) {
            if (currentPlatformInstance.isMoving && currentPlatformInstance.velocity?.x) {
              platformMovementEffectX = currentPlatformInstance.velocity.x * (deltaTime / (1000/60));
            }
            if (currentPlatformInstance.isSlippery) { 
              onSlipperyPlatform = true;
            }
          }
        }
        
        const currentHeroBaseSpeed = HERO_BASE_SPEED;
        const heroMovementX = (nextHero.currentSpeedX !== 0 ? (nextHero.currentSpeedX > 0 ? currentHeroBaseSpeed : -currentHeroBaseSpeed) : 0);

        let newPosX;
        if (onSlipperyPlatform) {
            if (nextHero.currentSpeedX !== 0) { 
                nextHero.slideVelocityX = heroMovementX; 
            } else { 
                nextHero.slideVelocityX = (nextHero.slideVelocityX || 0) * SLIPPERY_FRICTION_FACTOR;
                if (Math.abs(nextHero.slideVelocityX || 0) < 0.1) {
                    nextHero.slideVelocityX = 0;
                }
            }
            newPosX = nextHero.x + (nextHero.slideVelocityX || 0) * (deltaTime / (1000/60)) + platformMovementEffectX;
        } else {
            nextHero.slideVelocityX = 0; 
            newPosX = nextHero.x + heroMovementX * (deltaTime / (1000/60)) + platformMovementEffectX;
        }
        
        let newPosY = nextHero.y + newVelY * (deltaTime / (1000/60));
        
        if (newVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down'; 
        else if (newVelY > 0) nextHero.action = 'jump_up';
        else if (nextHero.currentSpeedX !== 0 && nextHero.isOnPlatform) {
             nextHero.action = nextHero.facingDirection === 'right' ? 'run_right' : 'run_left';
        }
        else if (nextHero.isOnPlatform && (nextHero.slideVelocityX === 0 || !onSlipperyPlatform) ) nextHero.action = 'idle'; 
        else if (nextHero.isOnPlatform && onSlipperyPlatform && nextHero.slideVelocityX !==0) {
            nextHero.action = nextHero.slideVelocityX > 0 ? 'run_right' : 'run_left'; 
        }


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
                 if (platform.isSlippery && nextHero.currentSpeedX === 0) {
                    // Keep existing slideVelocity if landing on slippery without input
                 } else if (!platform.isSlippery) {
                    nextHero.slideVelocityX = 0;
                 }
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
          const currentPlatform = nextPlatforms.find(p => p.id === nextHero.platformId);
          if (currentPlatform?.isSlippery) {
            if (nextHero.currentSpeedX === 0 && Math.abs(nextHero.slideVelocityX || 0) < 0.1) {
              nextHero.action = 'idle';
            } else if (Math.abs(nextHero.slideVelocityX || 0) >= 0.1) {
               nextHero.action = (nextHero.slideVelocityX || 0) > 0 ? 'run_right' : 'run_left';
            }
          } else {
            if (nextHero.currentSpeedX === 0 && finalVelY === 0) nextHero.action = 'idle';
            else if (nextHero.currentSpeedX !== 0 && finalVelY === 0) {
              nextHero.action = nextHero.facingDirection === 'right' ? 'run_right' : 'run_left';
            }
          }
        } else { 
          if (finalVelY > 0) nextHero.action = 'jump_up';
          else if (finalVelY < -GRAVITY_ACCELERATION * 0.5) nextHero.action = 'fall_down';
        }


        if (nextHero.x < 0) nextHero.x = 0;
        if (nextHero.x + nextHero.width > gameArea.width) nextHero.x = gameArea.width - nextHero.width;
        
        if (nextHero.y + nextHero.height > gameArea.height && !nextHero.isOnPlatform) {
             nextHero.y = gameArea.height - nextHero.height;
             nextHero.velocity.y = 0; // Stop vertical movement
             // Consider making the hero "land" on an invisible ground at gameArea.height if needed
        }
        // Ensure hero doesn't go above game area top
        if (nextHero.y + nextHero.height > gameArea.height) {
            nextHero.y = gameArea.height - nextHero.height;
             if (nextHero.velocity && nextHero.velocity.y > 0) {
                nextHero.velocity.y = 0;
             }
        }
        
        for (let i = 0; i < nextEnemies.length; i++) {
          const enemy = nextEnemies[i];
          if (enemy.isDefeated || enemy.isFrozen) continue; 

          const enemyCenterX = enemy.x + enemy.width / 2;
          const enemyCenterY = enemy.y + enemy.height / 2;
          const closestX = Math.max(nextHero.x, Math.min(enemyCenterX, nextHero.x + nextHero.width));
          const closestY = Math.max(nextHero.y, Math.min(enemyCenterY, nextHero.y + nextHero.height));
          const distanceX = enemyCenterX - closestX;
          const distanceY = enemyCenterY - closestY;
          const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

          if (distanceSquared < (enemy.collisionRadius * enemy.collisionRadius)) {
              if (!nextHero.isArmored) {
                heroHitByEnemy = true;
                tickSoundToPlay = 'Hero_fail';
              }
              
              const prevEnemyState = state.enemies.find(e => e.id === enemy.id);
              if (prevEnemyState && !prevEnemyState.isDefeated) {
                  // Only play bear voice if it's not the one about to be set by tickSoundToPlay
                  if (tickSoundToPlay !== 'bear_voice') {
                      tickSoundToPlay = 'bear_voice';
                  }
              }
              nextEnemies[i] = { 
                ...enemy,
                isDefeated: true, 
                defeatTimer: ENEMY_DEFEAT_DURATION_MS, 
                isFrozen: false, 
                frozenTimer: 0,
              };
              if (nextHero.isArmored) heroHitByEnemy = false; 
              break; 
          }
        }


        if (heroHitByEnemy && !nextHero.isArmored) { 
            nextHero.y = groundPlatformY + PLATFORM_GROUND_THICKNESS; 
            nextHero.x = gameArea.width / 2 - nextHero.width / 2;
            nextHero.velocity = { x: 0, y: 0 };
            nextHero.isOnPlatform = true;
            nextHero.platformId = 'platform_ground';
            nextHero.action = 'idle';
            nextHeroAppearance = 'appearing';
            nextHeroAppearElapsedTime = 0;
            nextHero.slideVelocityX = 0;
        }


        let collectedAnyCoinThisTick = false;
        let newlyCollectedCountThisTick = 0;
        
        if (!heroHitByEnemy || (heroHitByEnemy && nextHero.isArmored)) { 
            nextActiveCoins = nextActiveCoins.map(coin => {
              if (!coin.collected && !coin.isExploding && !coin.isSpawning && !coin.isPendingSpawn) { 
                if (nextHero.x < coin.x + coin.width &&
                    nextHero.x + nextHero.width > coin.x &&
                    nextHero.y < coin.y + coin.height &&
                    nextHero.y + nextHero.height > coin.y) { 
                  collectedAnyCoinThisTick = true;
                  newlyCollectedCountThisTick++;
                  tickSoundToPlay = 'takecoin';
                  return { ...coin, collected: true, isExploding: true, explosionProgress: 0 };
                }
              }
              return coin;
            });

            let shouldSpawnNextPair = false;
            if (collectedAnyCoinThisTick) {
              nextScore += newlyCollectedCountThisTick;
              const previousTotalCollected = nextTotalCollected;
              nextTotalCollected += newlyCollectedCountThisTick;
              
              if (state.currentLevel === 2 && previousTotalCollected === 0 && nextTotalCollected > 0 && !nextEnemies.some(e => e.id === 'enemy_level2_0' && !e.isDefeated)) {
                  const existingEnemy = nextEnemies.find(e => e.id === 'enemy_level2_0');
                  if (!existingEnemy) {
                    const newEnemy = getLevelEnemies(gameArea.width, gameArea.height, state.currentLevel, nextPlatforms).find(e => e.id === 'enemy_level2_0');
                    if (newEnemy) {
                       if (!nextBearVoicePlayed) {
                         if (tickSoundToPlay !== 'bear_voice') tickSoundToPlay = 'bear_voice';
                         nextBearVoicePlayed = true;
                       }
                       nextEnemies.push(newEnemy);
                    }
                  }
              }
              if (state.currentLevel === 3 && previousTotalCollected === 0 && nextTotalCollected > 0 && nextEnemies.filter(e => e.id.startsWith('enemy_level3_') && !e.isDefeated).length === 0) {
                  const newEnemiesL3 = getLevelEnemies(gameArea.width, gameArea.height, state.currentLevel, nextPlatforms);
                  let addedNewEnemy = false;
                  newEnemiesL3.forEach(ne => {
                      if (!nextEnemies.some(e => e.id === ne.id)) {
                        nextEnemies.push(ne);
                        addedNewEnemy = true;
                      }
                  });
                  if (addedNewEnemy && !nextBearVoicePlayed) {
                    if (tickSoundToPlay !== 'bear_voice') tickSoundToPlay = 'bear_voice';
                    nextBearVoicePlayed = true;
                  }
              }


              if (state.currentLevel === 2) {
                nextEnemies = nextEnemies.map(enemy => {
                  if (enemy.id === 'enemy_level2_0' && !enemy.isDefeated) { 
                    return {
                      ...enemy,
                      isFrozen: true,
                      frozenTimer: ENEMY_FREEZE_DURATION_MS,
                    };
                  }
                  return enemy;
                });
              } else if (state.currentLevel === 3) {
                 const isEvenCoinCollected = (nextTotalCollected % 2 === 0);
                 nextEnemies = nextEnemies.map(enemy => {
                    if (enemy.enemyId === 'enemy1' && isEvenCoinCollected && !enemy.isDefeated) {
                        return {...enemy, isFrozen: true, frozenTimer: ENEMY_FREEZE_DURATION_MS};
                    }
                    if (enemy.enemyId === 'enemy2' && !isEvenCoinCollected && !enemy.isDefeated) {
                        return {...enemy, isFrozen: true, frozenTimer: ENEMY_FREEZE_DURATION_MS};
                    }
                    return enemy;
                 });
              }


              const coinsOfCurrentPair = nextActiveCoins.filter(c => c.pairId === currentPairIdx);
              if (coinsOfCurrentPair.length > 0 && coinsOfCurrentPair.every(c => c.collected)) {
                if (nextTotalCollected < TOTAL_COINS_PER_LEVEL) {
                  nextPairIdx = currentPairIdx + 1;
                  shouldSpawnNextPair = true; 
                } else {
                  levelCompleteThisTick = true; 
                  tickSoundToPlay = 'allcoins';
                }
              }
            }

            nextActiveCoins = nextActiveCoins.filter(coin => !(coin.collected && coin.isExploding === false && coin.explosionProgress === 1));
            
            if (shouldSpawnNextPair) {
                const nextPairCoins = spawnNextCoinPair(gameArea, COIN_SIZE, nextPairIdx, nextPlatforms);
                nextActiveCoins = [...nextActiveCoins, ...nextPairCoins];
                playCoinSplashSound = true; 
            }
        }

        if (playCoinSplashSound) {
          // If another sound is already queued for this tick, coin splash might be overridden
          // Or, implement a queue for sounds to play
          if (!tickSoundToPlay) tickSoundToPlay = 'Coin_splash';
        }

        // Check for falling out of bounds
        if (nextHero.y + nextHero.height < 0 && !levelCompleteThisTick && !(heroHitByEnemy && !nextHero.isArmored)) {
          gameLostThisTick = true;
          tickSoundToPlay = 'Hero_fail';
        }
      } 
      
      let nextGameOver = state.gameOver;
      let nextLevelCompleteScreenActive = state.levelCompleteScreenActive;

      if (levelCompleteThisTick && !(heroHitByEnemy && !nextHero.isArmored) && !gameLostThisTick) {
        if (state.currentLevel === 3) { 
          nextGameOver = true;
        } else {
          nextLevelCompleteScreenActive = true;
        }
      }
      
      return { 
        ...state, 
        hero: nextHero, 
        platforms: nextPlatforms, 
        activeCoins: nextActiveCoins, 
        enemies: nextEnemies,
        score: nextScore,
        totalCoinsCollectedInLevel: nextTotalCollected,
        currentPairIndex: nextPairIdx,
        heroAppearance: nextHeroAppearance,
        heroAppearElapsedTime: nextHeroAppearElapsedTime,
        gameOver: nextGameOver, 
        gameLost: gameLostThisTick && !(heroHitByEnemy && !nextHero.isArmored), 
        levelCompleteScreenActive: nextLevelCompleteScreenActive, 
        bearVoicePlayedForLevel: nextBearVoicePlayed,
        soundToPlay: tickSoundToPlay,
      };
    }
    case 'EXIT_GAME': 
      initialGameState = getDefaultInitialGameState(state.gameArea.width, state.gameArea.height, 1);
      return {...initialGameState, gameOver: false, gameLost: false, levelCompleteScreenActive: false, soundToPlay: 'exit'}; 
    case 'SOUND_PLAYED':
      return { ...state, soundToPlay: null };
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
  }, [gameState.gameArea.width, gameState.gameArea.height, gameState.isGameInitialized, gameState.paddingTop, dispatch]);


  return { gameState, dispatch: handleGameAction, gameTick };
}

```