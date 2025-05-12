
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject extends Position, Size {
  id: string;
  velocity?: Position;
}

export type HeroAction = 'idle' | 'run_left' | 'run_right' | 'jump_up' | 'fall_down';
export type HeroFacingDirection = 'left' | 'right';

export interface HeroSpriteInfo {
  src: string;
  frames: number;
  fps: number;
  width: number;
  height: number;
}

export interface HeroAnimations {
  idle: HeroSpriteInfo;
  run: HeroSpriteInfo;
  jump: HeroSpriteInfo; 
}

export interface HeroType extends GameObject {
  action: HeroAction;
  isOnPlatform: boolean;
  platformId: string | null;
  currentSpeedX: number; 
  facingDirection: HeroFacingDirection; 
  animations: HeroAnimations;
  currentFrame: number;
  frameTime: number;
  slideVelocityX?: number; 
  isArmored?: boolean;
  armorTimer?: number;
  armorCooldownTimer?: number;
  armorRemainingTime?: number; 
}

export interface PlatformType extends GameObject {
  isMoving: boolean;
  speed: number;
  direction: 1 | -1; 
  moveAxis: 'x' | 'y';
  moveRange?: { min: number; max: number };
  imageSrc?: string;
  isSlippery?: boolean;
}

export interface CoinType extends GameObject {
  collected: boolean;
  isExploding?: boolean;
  explosionProgress?: number; 
  isSpawning?: boolean; 
  spawnExplosionProgress?: number; 
  pairId?: number; 
  isPendingSpawn?: boolean; 
  spawnDelayMs?: number; 
}

export interface EnemyType extends GameObject {
  enemyId?: 'enemy1' | 'enemy2'; 
  imageSrc: string;
  speed: number;
  direction: 1 | -1;
  moveAxis: 'x' | 'y';
  moveRange?: { min: number; max: number };
  collisionRadius: number;
  isDefeated?: boolean;
  defeatTimer?: number;
  isFrozen?: boolean;
  frozenTimer?: number;
  periodicFreezeIntervalTimer?: number; 
}


export interface LevelData {
  id: number;
  name: string;
  initialPlatforms: PlatformType[];
  initialCoins: CoinType[];
  gameBackgroundColor: string; 
}

export const HERO_APPEARANCE_DURATION_MS = 1000; 
export const COIN_EXPLOSION_DURATION_MS = 500; 
export const COIN_SPAWN_EXPLOSION_DURATION_MS = 300; 
export const COIN_SPAWN_DELAY_MS = 500; 


export const PLATFORM_GROUND_THICKNESS = 1; 
// This is the Y coordinate (from the bottom of the game view) for the ground platform's bottom edge.
// Since the game view's height is 90% of the screen and control panel is 10%,
// this offset effectively places the ground at the top of the control panel.
export const PLATFORM_GROUND_Y_FROM_BOTTOM_OFFSET = 0; // Ground is at the very bottom of the playable game area.


export const HERO_WIDTH = 30;
export const HERO_HEIGHT = 80; 
export const COIN_SIZE = 20;
export const PLATFORM_DEFAULT_WIDTH = 130; 
export const PLATFORM_NON_GROUND_HEIGHT = 24;

// Absolute Y coordinates (from game ground / top of control panel) for platform tops
export const LOWER_PLATFORM_TOP_Y_ABS = 200;
export const UPPER_PLATFORM_TOP_Y_ABS = 400;

// TARGET_JUMP_HEIGHT_PX is the desired height the hero can jump *above* their current standing surface.
export const TARGET_JUMP_HEIGHT_PX = 250; 

// Y offsets for moving platforms, relative to the top of the ground platform.
// PLATFORM1_Y_OFFSET is for the lower moving platform. Its top surface will be at:
// PLATFORM_GROUND_Y_FROM_BOTTOM_OFFSET + PLATFORM_GROUND_THICKNESS + PLATFORM1_Y_OFFSET
// = 0 + 1 + PLATFORM1_Y_OFFSET.
// To make its top surface at LOWER_PLATFORM_TOP_Y_ABS (200):
// 1 + PLATFORM1_Y_OFFSET = LOWER_PLATFORM_TOP_Y_ABS
// PLATFORM1_Y_OFFSET = LOWER_PLATFORM_TOP_Y_ABS - 1
export const PLATFORM1_Y_OFFSET = LOWER_PLATFORM_TOP_Y_ABS - PLATFORM_GROUND_THICKNESS; // Lower moving platform

// PLATFORM2_Y_OFFSET is for the upper moving platform. Its top surface will be at:
// PLATFORM_GROUND_Y_FROM_BOTTOM_OFFSET + PLATFORM_GROUND_THICKNESS + PLATFORM2_Y_OFFSET
// To make its top surface at UPPER_PLATFORM_TOP_Y_ABS (400):
// 1 + PLATFORM2_Y_OFFSET = UPPER_PLATFORM_TOP_Y_ABS
// PLATFORM2_Y_OFFSET = UPPER_PLATFORM_TOP_Y_ABS - 1
export const PLATFORM2_Y_OFFSET = UPPER_PLATFORM_TOP_Y_ABS - PLATFORM_GROUND_THICKNESS; // Upper moving platform


export const ENEMY2_LEVEL3_Y_OFFSET_FROM_PLATFORM2 = 50;


export const INITIAL_PLATFORM_SPEED = 0.75; 
export const INITIAL_PLATFORM1_X_PERCENT = 0.0; 
export const INITIAL_PLATFORM2_X_PERCENT = 1.0;


export const TOTAL_COINS_PER_LEVEL = 10;
export const COINS_PER_PAIR = 2;
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR = 0.25; 
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR = 0.15; 


// COIN_ZONE_TOP_OFFSET is the distance from the top of the game area to the top of the coin spawn zone.
// If gameArea.height is ~650px, and this is 100, then the top of the coin zone is 650-100 = 550px from ground.
export const COIN_ZONE_TOP_OFFSET = 100; 
// Comment: Previous "Верхняя граница зоны монеток 600 пикс." implied offset 50 for gameArea.height 650.
// New request: "ограничим зону монеток по высоте в 550 пикселей от верхнего края панели управления"
// Assuming top of control panel is y=0 for game area, this means absolute Y for top of coin zone is 550.
// If gameArea.height (playable) is ~650px, then COIN_ZONE_TOP_OFFSET should be 650 - 550 = 100.

export const HERO_BASE_SPEED = 1.25; 
export const SLIPPERY_FRICTION_FACTOR = 0.92; 

export const ENEMY_WIDTH = 48;
export const ENEMY_HEIGHT = 48;
export const ENEMY_COLLISION_RADIUS = 24; 
export const ENEMY_IMAGE_SRC_LVL2 = "/assets/images/bearFace.png";
export const ENEMY_IMAGE_SRC_LVL3_ENEMY1 = "/assets/images/bearFace.png";
export const ENEMY_IMAGE_SRC_LVL3_ENEMY2 = "/assets/images/BearFaceDark.png";
export const ENEMY_DEFAULT_SPEED = 0.4; 
export const ENEMY_DEFEAT_DURATION_MS = 5000; 
export const ENEMY_FREEZE_DURATION_MS = 5000; 
export const ENEMY_PERIODIC_FREEZE_INTERVAL_MS = 5000; 

export const ARMOR_DURATION_LEVEL_2 = 7000; 
export const ARMOR_COOLDOWN_LEVEL_2 = 7000; 
export const ARMOR_DURATION_LEVEL_3 = 12000; 
export const ARMOR_COOLDOWN_LEVEL_3 = 10000; 

// Platform image sources
export const PLATFORM_GRASS_SRC = "/assets/images/PlatformGrassShort.png";
export const PLATFORM_ICE_SRC = "/assets/images/platform_ice.png";
export const PLATFORM_STONE_SRC = "/assets/images/platform_stone.png";

// Background image sources
export const BACKGROUND_LEVEL1_SRC = "/assets/images/BackGroundBase.png";
export const BACKGROUND_LEVEL2_SRC = "/assets/images/level2_bkg.png";
export const BACKGROUND_LEVEL3_SRC = "/assets/images/level3_bkg.png";


export interface GameState {
  hero: HeroType;
  platforms: PlatformType[];
  activeCoins: CoinType[]; 
  enemies: EnemyType[];
  score: number;
  currentLevel: number;
  gameOver: boolean; 
  gameLost: boolean; 
  gameArea: Size;
  isGameInitialized: boolean; 
  paddingTop: number; 
  heroAppearance: 'appearing' | 'visible'; 
  heroAppearElapsedTime: number; 
  totalCoinsCollectedInLevel: number; 
  currentPairIndex: number; 
  debugMode?: boolean; 
  levelCompleteScreenActive: boolean;
  bearVoicePlayedForLevel: boolean;
}

export type GameAction =
  | { type: 'MOVE_LEFT_START' }
  | { type: 'MOVE_LEFT_STOP' }
  | { type: 'MOVE_RIGHT_START' }
  | { type: 'MOVE_RIGHT_STOP' }
  | { type: 'JUMP' }
  | { type: 'EXIT_GAME' } 
  | { type: 'RESTART_LEVEL' } 
  | { type: 'NEXT_LEVEL' }
  | { type: 'GAME_WON' } 
  | { type: 'UPDATE_GAME_AREA', payload: { width: number; height: number; paddingTop: number; } }
  | { type: 'GAME_TICK', payload: { deltaTime: number } }
  | { type: 'SET_DEBUG_LEVEL_COMPLETE', payload: boolean }
  | { type: 'SET_DEBUG_LEVEL', payload: number };


export const heroAnimationsConfig: HeroAnimations = {
  idle: {
    src: "/assets/images/HeroJeans3.png", 
    frames: 1,
    fps: 1,
    width: HERO_WIDTH, 
    height: HERO_HEIGHT, 
  },
  run: {
    src: "/assets/images/HeroJeans3.png", 
    frames: 1, 
    fps: 10, 
    width: HERO_WIDTH, 
    height: HERO_HEIGHT,
  },
  jump: {
    src: "/assets/images/HeroJeans3.png", 
    frames: 1, 
    fps: 1,
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
  },
};
