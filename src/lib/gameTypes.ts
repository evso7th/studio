
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

export interface HeroType extends GameObject {
  action: HeroAction;
  isOnPlatform: boolean;
  platformId: string | null;
  currentSpeedX: number; // For horizontal movement independent of platform
}

export interface PlatformType extends GameObject {
  color: string; // Converted to HSL string for style
  isMoving: boolean;
  speed: number;
  direction: 1 | -1; // 1 for right/up, -1 for left/down
  moveAxis: 'x' | 'y';
  moveRange?: { min: number; max: number };
}

export interface CoinType extends GameObject {
  color: string; // Converted to HSL string for style
  collected: boolean;
  isExploding?: boolean;
  explosionProgress?: number; // 0 to 1 for collection explosion
  isSpawning?: boolean; // True when the coin is in its appearance animation
  spawnExplosionProgress?: number; // 0 to 1 for appearance explosion
  pairId?: number; // To identify which pair a coin belongs to
  isPendingSpawn?: boolean; // True if the coin is waiting for a delay before spawning
  spawnDelayMs?: number; // Remaining delay in milliseconds before spawning
}

export interface LevelData {
  id: number;
  name: string;
  initialPlatforms: PlatformType[];
  initialCoins: CoinType[];
  gameBackgroundColor: string; // CSS class like 'bg-blue-700' or HSL string
}

export const HERO_APPEARANCE_DURATION_MS = 1000; // 1 second for hero to appear
export const COIN_EXPLOSION_DURATION_MS = 500; // 0.5 seconds for coin collection explosion
export const COIN_SPAWN_EXPLOSION_DURATION_MS = 300; // 0.3 seconds for coin spawn explosion
export const COIN_SPAWN_DELAY_MS = 200; // 0.2 seconds delay for the second coin in a pair

export const PLATFORM_GROUND_Y = 55; 
export const PLATFORM_GROUND_THICKNESS = 1; 

export const HERO_WIDTH = 30;
export const HERO_HEIGHT = 80; 
export const COIN_SIZE = 20;
export const PLATFORM_DEFAULT_WIDTH = 130; 
export const PLATFORM_NON_GROUND_HEIGHT = 24;

export const TARGET_JUMP_HEIGHT_PX = 180; 

export const PLATFORM1_Y_OFFSET = 90; 
export const PLATFORM2_Y_OFFSET = 210; 

export const INITIAL_PLATFORM1_X_PERCENT = 0.2; 
export const INITIAL_PLATFORM1_SPEED = 0.25;

export const INITIAL_PLATFORM2_X_PERCENT = 0.6;
export const INITIAL_PLATFORM2_SPEED = 0.25;

// Coin Spawning Zone constants (from top of game area)
export const COIN_ZONE_TOP_OFFSET = 50; 
// export const COIN_ZONE_BOTTOM_OFFSET = 250; // This was effectively PLATFORM1_Y_OFFSET + PLATFORM_NON_GROUND_HEIGHT


export const TOTAL_COINS_PER_LEVEL = 10;
export const COINS_PER_PAIR = 2;
export const MIN_DISTANCE_BETWEEN_PAIR_COINS_X_FACTOR = 0.25; // Min horizontal distance as % of game area width


export interface GameState {
  hero: HeroType;
  platforms: PlatformType[];
  activeCoins: CoinType[]; // Max 2 coins (one pair) currently on screen and interactive
  score: number;
  currentLevel: number;
  gameOver: boolean; // True when level is completed or hero falls
  gameArea: Size;
  isGameInitialized: boolean; 
  paddingTop: number; 
  heroAppearance: 'appearing' | 'visible'; 
  heroAppearElapsedTime: number; 
  totalCoinsCollectedInLevel: number; // Tracks total coins collected towards level completion
  currentPairIndex: number; // Index of the current coin pair (0 to TOTAL_COINS_PER_LEVEL / COINS_PER_PAIR - 1)
  debugMode?: boolean; 
}

export type GameAction =
  | { type: 'MOVE_LEFT_START' }
  | { type: 'MOVE_LEFT_STOP' }
  | { type: 'MOVE_RIGHT_START' }
  | { type: 'MOVE_RIGHT_STOP' }
  | { type: 'JUMP' }
  | { type: 'EXIT_GAME' }
  | { type: 'UPDATE_GAME_AREA', payload: { width: number; height: number; paddingTop: number; } }
  | { type: 'GAME_TICK', payload: { gameArea: Size, deltaTime: number } };

