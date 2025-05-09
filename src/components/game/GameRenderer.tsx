"use client";
import type { HeroType, PlatformType, CoinType } from "@/lib/gameTypes";
import { cn } from "@/lib/utils";

interface GameObjectStyleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  gameAreaHeight: number;
  color?: string;
  heroAction?: HeroType['action'];
}

function getGameObjectStyle({ x, y, width, height, gameAreaHeight, color, heroAction }: GameObjectStyleProps): React.CSSProperties {
  // Convert bottom-left origin (y) to top-left origin for CSS `top` property
  const top = gameAreaHeight - y - height;
  let dynamicStyles: React.CSSProperties = {};

  if (color) {
    dynamicStyles.backgroundColor = color;
  }

  // Simple hero animation visualization
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
        // Placeholder for running animation - maybe a slight skew or width change
        // dynamicStyles.transform = 'skewX(-5deg)';
        break;
      default: // idle
        dynamicStyles.transform = 'none';
        break;
    }
  }
  
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${top}px`, // Use top instead of bottom for consistency if gameAreaHeight is available
    width: `${width}px`,
    height: `${height}px`,
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    borderRadius: '2px', // Slight rounding for pixel art feel
    ...dynamicStyles,
  };
}

export function HeroComponent({ hero, gameAreaHeight }: { hero: HeroType; gameAreaHeight: number }) {
  if (!gameAreaHeight) return null;
  return (
    <div
      style={getGameObjectStyle({ ...hero, gameAreaHeight, color: `hsl(var(--hero-color))`, heroAction: hero.action })}
      className="transition-all duration-50 ease-linear"
      role="img"
      aria-label="Hero"
    />
  );
}

export function PlatformComponent({ platform, gameAreaHeight }: { platform: PlatformType; gameAreaHeight: number }) {
  if (!gameAreaHeight) return null;
  return (
    <div
      style={getGameObjectStyle({ ...platform, gameAreaHeight, color: platform.color })}
      role="presentation" // Platforms are part of the environment
    />
  );
}

export function CoinComponent({ coin, gameAreaHeight }: { coin: CoinType; gameAreaHeight: number }) {
  if (coin.collected || !gameAreaHeight) return null;
  return (
    <div
      style={getGameObjectStyle({ ...coin, gameAreaHeight, color: coin.color })}
      className="rounded-full" // Make coins circular
      role="button" // Coins are interactive items
      aria-label="Coin"
    />
  );
}
