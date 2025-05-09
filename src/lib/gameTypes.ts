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

export interface GameState {
  hero: HeroType;
  platforms: PlatformType[];
  coins: CoinType[];
  score: number;
  currentLevel: number;
  gameOver: boolean;
  gameArea: Size;
  debugMode?: boolean; // Optional for showing collision boxes etc.
}

export type GameAction =
  | { type: 'MOVE_LEFT_START' }
  | { type: 'MOVE_LEFT_STOP' }
  | { type: 'MOVE_RIGHT_START' }
  | { type: 'MOVE_RIGHT_STOP' }
  | { type: 'JUMP' }
  | { type: 'EXIT_GAME' }
  | { type: 'UPDATE_GAME_AREA', payload: Size }
  | { type: 'GAME_TICK', payload: { gameArea: Size } };
