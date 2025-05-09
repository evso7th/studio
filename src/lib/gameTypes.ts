
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
}

export interface LevelData {
  id: number;
  name: string;
  initialPlatforms: PlatformType[];
  initialCoins: CoinType[];
  gameBackgroundColor: string; // CSS class like 'bg-blue-700' or HSL string
}

export const HERO_APPEARANCE_DURATION_MS = 1000; // 1 second for hero to appear

// PLATFORM_GROUND_Y defines the Y-coordinate of the BOTTOM of the ground platform.
// It is measured from the bottom of the game area.
// So, if gameArea.height is 600 and PLATFORM_GROUND_Y is 58, the platform's bottom edge will be at y=58.
// Its top surface (where the hero stands) will be at y = 58 + PLATFORM_GROUND_THICKNESS.
export const PLATFORM_GROUND_Y = 58; 
export const PLATFORM_GROUND_THICKNESS = 1; // Thickness of the ground platform

export const HERO_HEIGHT = 60; // Height of the hero
export const COIN_SIZE = 20;
export const PLATFORM_DEFAULT_WIDTH = 130; // Default width for non-ground platforms
export const PLATFORM_NON_GROUND_HEIGHT = 24; // Default height for non-ground platforms


export interface GameState {
  hero: HeroType;
  platforms: PlatformType[];
  coins: CoinType[];
  score: number;
  currentLevel: number;
  gameOver: boolean;
  gameArea: Size;
  isGameInitialized: boolean; // Added for initial setup
  paddingTop: number; // Added to store container's paddingTop for rendering offset
  heroAppearance: 'appearing' | 'visible'; // For intro animation
  heroAppearElapsedTime: number; // Milliseconds elapsed in hero appearance animation
  debugMode?: boolean; // Optional for showing collision boxes etc.
}

export type GameAction =
  | { type: 'MOVE_LEFT_START' }
  | { type: 'MOVE_LEFT_STOP' }
  | { type: 'MOVE_RIGHT_START' }
  | { type: 'MOVE_RIGHT_STOP' }
  | { type: 'JUMP' }
  | { type: 'EXIT_GAME' }
  | { type: 'UPDATE_GAME_AREA', payload: { width: number; height: number; paddingTop: number; } }
  | { type: 'GAME_TICK', payload: { gameArea: Size } };

