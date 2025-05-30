
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
  defeatExplosionProgress?: number;
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
export const PLATFORM_GROUND_Y_FROM_BOTTOM_OFFSET = 60;


export const HERO_WIDTH = 30;
export const HERO_HEIGHT = 60; // Increased by 50% from 40
export const COIN_SIZE = 20;
export const PLATFORM_DEFAULT_WIDTH = 130;
export const PLATFORM_NON_GROUND_HEIGHT = 24;

export const TARGET_JUMP_HEIGHT_PX = 250;

export const PLATFORM1_Y_OFFSET = 200; // Height of lower moving platform from ground platform top
export const PLATFORM2_Y_OFFSET = 400; // Height of upper moving platform from ground platform top


export const ENEMY2_LEVEL3_Y_OFFSET_FROM_PLATFORM2 = 50;


export const INITIAL_PLATFORM_SPEED = 0.75;
export const INITIAL_PLATFORM1_X_PERCENT = 0.0; // Start from left edge
export const INITIAL_PLATFORM2_X_PERCENT = 1.0; // Start from right edge


export const TOTAL_COINS_PER_LEVEL = 10;
export const COINS_PER_PAIR = 2;
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR = 0.25;
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR = 0.15;

export const MAX_COIN_SPAWN_Y_FROM_CONTROL_PANEL_TOP = 550;
export const COIN_ZONE_TOP_OFFSET = 50; // Added for clarity if needed elsewhere
export const LOWER_PLATFORM_Y_FROM_BOTTOM = 200;


export const HERO_BASE_SPEED = 1.25;
export const SLIPPERY_FRICTION_FACTOR = 0.92;

export const ENEMY_WIDTH = 48;
export const ENEMY_HEIGHT = 48;
export const ENEMY_COLLISION_RADIUS = 24;
export const ENEMY_IMAGE_SRC_LVL2 = "/assets/images/bearface.png";
export const ENEMY_IMAGE_SRC_LVL3_ENEMY1 = "/assets/images/bearface.png";
export const ENEMY_IMAGE_SRC_LVL3_ENEMY2 = "/assets/images/bearface_dark.png";
export const ENEMY_DEFAULT_SPEED = 0.4;
export const ENEMY_DEFEAT_DURATION_MS = 5000;
export const ENEMY_FREEZE_DURATION_MS = 5000;
export const ENEMY_PERIODIC_FREEZE_INTERVAL_MS = 5000;

export const ARMOR_DURATION_LEVEL_2 = 7000;
export const ARMOR_COOLDOWN_LEVEL_2 = 7000;
export const ARMOR_DURATION_LEVEL_3 = 12000;
export const ARMOR_COOLDOWN_LEVEL_3 = 10000;

// Platform image sources
export const PLATFORM_GRASS_SRC = "/assets/images/platform_grass.png";
export const PLATFORM_ICE_SRC = "/assets/images/platform_ice.png";
export const PLATFORM_STONE_SRC = "/assets/images/platform_stone.png";
export const GROUND_FLOOR_SRC = "/assets/images/groundfloor.png";


// Background image sources
export const BACKGROUND_LEVEL1_SRC = "/assets/images/level1_bkg.png";
export const BACKGROUND_LEVEL2_SRC = "/assets/images/level2_bkg.png";
export const BACKGROUND_LEVEL3_SRC = "/assets/images/level3_bkg.png";

export const CONTROL_PANEL_HEIGHT_PX = 80;
export const MARQUEE_HEIGHT_PX = 40;

export const SAFE_AREA_BOTTOM_PADDING = 0; // Base padding if not Yandex
export const YANDEX_BROWSER_BOTTOM_OFFSET = 32; // Additional padding for Yandex


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
  showDebugLevelComplete?: boolean;
  showDebugFinalScreen?: boolean;
  bearVoicePlayedForLevel: boolean;
  soundToPlay: string | null; // Added to manage sound effects
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
  | { type: 'SET_DEBUG_LEVEL', payload: number }
  | { type: 'SOUND_PLAYED' }; // Action to reset soundToPlay


export const heroAnimationsConfig: HeroAnimations = {
  idle: {
    src: "/assets/images/hero_jeans3.png",
    frames: 1,
    fps: 1,
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
  },
  run: {
    src: "/assets/images/hero_jeans3.png",
    frames: 1,
    fps: 10,
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
  },
  jump: {
    src: "/assets/images/hero_jeans3.png",
    frames: 1,
    fps: 1,
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
  },
};


export const GAME_TICK_INTERVAL_MS = 1000 / 60; // For a 60 FPS game loop
```