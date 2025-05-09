
"use client";
import type { HeroType, PlatformType, CoinType } from "@/lib/gameTypes";
import { cn } from "@/lib/utils";

interface GameObjectStylePropsBase {
  x: number;
  y: number; // Game logic Y: 0 is bottom of effective game area
  width: number;
  height: number;
  gameAreaHeight: number; // Effective game area height
  paddingTop: number; // Padding top of the parent container
  color?: string;
  heroAction?: HeroType['action'];
}

function getGameObjectStyle({ x, y, width, height, gameAreaHeight, paddingTop, color, heroAction }: GameObjectStylePropsBase): React.CSSProperties {
  // Convert bottom-left origin (y in effective area) to top-left origin for CSS `top` property relative to parent container
  const topInEffectiveArea = gameAreaHeight - y - height;
  const finalCssTop = paddingTop + topInEffectiveArea;
  
  let dynamicStyles: React.CSSProperties = {};

  if (color) {
    dynamicStyles.backgroundColor = color;
  }

  if (heroAction) {
    switch (heroAction) {
      case 'jump_up':
        dynamicStyles.transform = 'scaleY(0.8) translateY(-5px)';
        dynamicStyles.transition = 'transform 0.1s ease-out';
        break;
      case 'fall_down':
        dynamicStyles.transform = 'scaleY(1.1) translateY(2px)';
        dynamicStyles.transition = 'transform 0.1s ease-in';
        break;
      case 'run_left':
      case 'run_right':
        break;
      default: 
        dynamicStyles.transform = 'none';
        break;
    }
  }
  
  return {
    position: 'absolute',
    left: `${x}px`, // Assuming x is relative to effective area's left, and no parent padding-left to account for here
    top: `${finalCssTop}px`, 
    width: `${width}px`,
    height: `${height}px`,
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    borderRadius: '2px', 
    ...dynamicStyles,
  };
}

interface GameObjectComponentProps {
  gameAreaHeight: number;
  paddingTop: number;
}

export function HeroComponent({ hero, gameAreaHeight, paddingTop }: { hero: HeroType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null; // Allow 0 height if intended.
  return (
    <div
      style={getGameObjectStyle({ ...hero, gameAreaHeight, paddingTop, color: `hsl(var(--hero-color))`, heroAction: hero.action })}
      className="transition-all duration-50 ease-linear"
      role="img"
      aria-label="Hero"
    />
  );
}

export function PlatformComponent({ platform, gameAreaHeight, paddingTop }: { platform: PlatformType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null;
  return (
    <div
      style={getGameObjectStyle({ ...platform, gameAreaHeight, paddingTop, color: platform.color })}
      role="presentation" 
    />
  );
}

export function CoinComponent({ coin, gameAreaHeight, paddingTop }: { coin: CoinType } & GameObjectComponentProps) {
  if (coin.collected || (!gameAreaHeight && gameAreaHeight !== 0)) return null;
  return (
    <div
      style={getGameObjectStyle({ ...coin, gameAreaHeight, paddingTop, color: coin.color })}
      className="rounded-full" 
      role="button" 
      aria-label="Coin"
    />
  );
}
