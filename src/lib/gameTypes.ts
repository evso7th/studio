
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
}

export interface PlatformType extends GameObject {
  isMoving: boolean;
  speed: number;
  direction: 1 | -1; 
  moveAxis: 'x' | 'y';
  moveRange?: { min: number; max: number };
  imageSrc?: string;
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
  imageSrc: string;
  speed: number;
  direction: 1 | -1;
  moveAxis: 'x' | 'y';
  moveRange?: { min: number; max: number };
  collisionRadius: number;
  isDefeated?: boolean;
  defeatTimer?: number;
  defeatExplosionProgress?: number;
  isFrozen?: boolean;
  frozenTimer?: number;
  periodicFreezeIntervalTimer?: number; // Time until the next periodic freeze
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

export const PLATFORM_GROUND_Y_FROM_BOTTOM = 55; 
export const PLATFORM_GROUND_THICKNESS = 1; 

export const HERO_WIDTH = 30;
export const HERO_HEIGHT = 80; 
export const COIN_SIZE = 20;
export const PLATFORM_DEFAULT_WIDTH = 130; 
export const PLATFORM_NON_GROUND_HEIGHT = 24;

export const TARGET_JUMP_HEIGHT_PX = 180; 

export const PLATFORM1_Y_OFFSET = 136; 
export const PLATFORM2_Y_OFFSET = 275; 


export const INITIAL_PLATFORM_SPEED = 0.75; 
export const INITIAL_PLATFORM1_X_PERCENT = 0.0; 
export const INITIAL_PLATFORM2_X_PERCENT = 1.0;


export const TOTAL_COINS_PER_LEVEL = 10;
export const COINS_PER_PAIR = 2;
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR = 0.25; 
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_Y_FACTOR = 0.15; 


export const COIN_ZONE_TOP_OFFSET = 50; 

export const HERO_BASE_SPEED = 1.25; 

export const ENEMY_WIDTH = 48;
export const ENEMY_HEIGHT = 48;
export const ENEMY_COLLISION_RADIUS = 24; // Half of width/height
export const ENEMY_IMAGE_SRC = "/assets/images/bearFace.png";
export const ENEMY_DEFAULT_SPEED = 0.4; 
export const ENEMY_DEFEAT_DURATION_MS = 5000; 
export const ENEMY_DEFEAT_EXPLOSION_DURATION_MS = 500; 
export const ENEMY_FREEZE_DURATION_MS = 5000; // 5 seconds
export const ENEMY_PERIODIC_FREEZE_INTERVAL_MS = 5000; // Enemy freezes every 5 seconds

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
  | { type: 'UPDATE_GAME_AREA', payload: { width: number; height: number; paddingTop: number; } }
  | { type: 'GAME_TICK', payload: { deltaTime: number } }
  | { type: 'SET_DEBUG_LEVEL_COMPLETE', payload: boolean }; 

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
