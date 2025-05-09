
"use client";
import type { HeroType, PlatformType, CoinType } from "@/lib/gameTypes";
import { HERO_APPEARANCE_DURATION_MS } from "@/lib/gameTypes";
import { cn } from "@/lib/utils";

interface AppearanceProps {
  type: 'heroAppear';
  progress: number; // 0 to 1
}

interface GameObjectStylePropsBase {
  x: number;
  y: number; 
  width: number;
  height: number;
  gameAreaHeight: number; 
  paddingTop: number; 
  color?: string;
  heroAction?: HeroType['action'];
  appearanceProps?: AppearanceProps;
  shape?: 'rect' | 'circle';
}

function getGameObjectStyle({ x, y, width, height, gameAreaHeight, paddingTop, color, heroAction, appearanceProps, shape = 'rect' }: GameObjectStylePropsBase): React.CSSProperties {
  const topInEffectiveArea = gameAreaHeight - y - height;
  const finalCssTop = paddingTop + topInEffectiveArea;
  
  let dynamicStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${finalCssTop}px`, 
    width: `${width}px`,
    height: `${height}px`,
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    // borderRadius will be set based on shape or appearanceProps
  };

  if (color) {
    dynamicStyles.backgroundColor = color;
  }

  if (appearanceProps?.type === 'heroAppear') {
    const progress = appearanceProps.progress;
    dynamicStyles.opacity = progress;
    dynamicStyles.transform = `scale(${progress})`;
    dynamicStyles.transformOrigin = 'center bottom'; // Scale from the bottom center
    // borderRadius is default (rect) during appearance, or could be part of the effect
    dynamicStyles.borderRadius = '2px'; 
  } else {
    // Apply shape-specific borderRadius if not in appearance animation (or if appearance doesn't define one)
    if (shape === 'circle') {
      dynamicStyles.borderRadius = '50%';
    } else {
      dynamicStyles.borderRadius = '2px'; // Default for rectangles
    }

    // Apply hero action animations only if not appearing
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
          dynamicStyles.transform = 'none';
          dynamicStyles.transition = 'transform 0.1s ease-out';
          break;
        default: 
          dynamicStyles.transform = 'none';
          dynamicStyles.transition = 'transform 0.1s ease-in-out';
          break;
      }
    }
  }
  
  return dynamicStyles;
}

interface GameObjectComponentProps {
  gameAreaHeight: number;
  paddingTop: number;
}

interface HeroComponentProps extends GameObjectComponentProps {
  hero: HeroType;
  heroAppearance: 'appearing' | 'visible';
  heroAppearElapsedTime: number;
  heroAppearanceDuration: number;
}

export function HeroComponent({ hero, gameAreaHeight, paddingTop, heroAppearance, heroAppearElapsedTime, heroAppearanceDuration }: HeroComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null; 

  let appearanceProps: AppearanceProps | undefined = undefined;
  if (heroAppearance === 'appearing') {
    const progress = Math.min(1, heroAppearElapsedTime / heroAppearanceDuration);
    appearanceProps = { type: 'heroAppear', progress };
  }

  return (
    <div
      style={getGameObjectStyle({ 
        ...hero, 
        gameAreaHeight, 
        paddingTop, 
        color: `hsl(var(--hero-color))`, 
        heroAction: hero.action,
        appearanceProps,
        shape: 'rect' 
      })}
      role="img"
      aria-label="Hero"
    />
  );
}

export function PlatformComponent({ platform, gameAreaHeight, paddingTop }: { platform: PlatformType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null;
  return (
    <div
      style={getGameObjectStyle({ ...platform, gameAreaHeight, paddingTop, color: platform.color, shape: 'rect' })}
      role="presentation" 
    />
  );
}

export function CoinComponent({ coin, gameAreaHeight, paddingTop }: { coin: CoinType } & GameObjectComponentProps) {
  if (coin.collected || (!gameAreaHeight && gameAreaHeight !== 0)) return null;
  return (
    <div
      style={getGameObjectStyle({ ...coin, gameAreaHeight, paddingTop, color: coin.color, shape: 'circle' })}
      // className="rounded-full" // Now handled by getGameObjectStyle with shape: 'circle'
      role="button" 
      aria-label="Coin"
    />
  );
}
