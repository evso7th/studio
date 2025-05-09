
"use client";
import type { HeroType, PlatformType, CoinType } from "@/lib/gameTypes";
import { HERO_APPEARANCE_DURATION_MS } from "@/lib/gameTypes";
import { cn } from "@/lib/utils";
import React from 'react'; // Ensure React is imported for JSX

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
  };

  if (color) {
    dynamicStyles.backgroundColor = color;
  }

  if (appearanceProps?.type === 'heroAppear') {
    const progress = appearanceProps.progress;
    dynamicStyles.opacity = progress;
    dynamicStyles.transform = `scale(${progress})`;
    dynamicStyles.transformOrigin = 'center bottom'; 
    dynamicStyles.borderRadius = '2px'; 
  } else {
    if (shape === 'circle') {
      dynamicStyles.borderRadius = '50%';
    } else {
      dynamicStyles.borderRadius = '2px'; 
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
          dynamicStyles.transform = 'none';
          // Removed transition for run to avoid conflict with appearance scaling
          // dynamicStyles.transition = 'transform 0.1s ease-out';
          break;
        default: 
          dynamicStyles.transform = 'none';
          // dynamicStyles.transition = 'transform 0.1s ease-in-out';
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
  const platformStyle = getGameObjectStyle({ ...platform, gameAreaHeight, paddingTop, color: platform.color, shape: 'rect' });
  
  // Add background image style for platforms
  platformStyle.backgroundImage = 'url("/assets/images/platform-texture.png")'; // Assuming texture is in public/assets/images
  platformStyle.backgroundSize = 'cover'; // Or 'contain', 'repeat', etc.
  platformStyle.backgroundPosition = 'center';

  return (
    <div
      style={platformStyle}
      role="presentation" 
    />
  );
}


const NUM_PARTICLES = 8;
const PARTICLE_SIZE = 5; // pixels
const EXPLOSION_SPREAD_RADIUS = 40; // pixels

export function CoinComponent({ coin, gameAreaHeight, paddingTop }: { coin: CoinType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null;

  const baseStyle = getGameObjectStyle({ 
    ...coin, 
    gameAreaHeight, 
    paddingTop, 
    color: coin.color, 
    shape: 'circle' 
  });

  if (coin.isExploding && coin.explosionProgress != null && coin.explosionProgress < 1) {
    const particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      // Calculate a somewhat random angle and distance for each particle
      const angle = (i / NUM_PARTICLES) * 2 * Math.PI + (Math.random() - 0.5) * 0.5; // Add some randomness
      const distance = EXPLOSION_SPREAD_RADIUS * coin.explosionProgress * (0.5 + Math.random() * 0.5); // Particles spread further as progress increases

      const particleX = Math.cos(angle) * distance;
      const particleY = Math.sin(angle) * distance;

      const particleStyle: React.CSSProperties = {
        position: 'absolute',
        left: `calc(50% + ${particleX}px - ${PARTICLE_SIZE / 2}px)`, // Center particle then offset
        top: `calc(50% + ${particleY}px - ${PARTICLE_SIZE / 2}px)`,  // Center particle then offset
        width: `${PARTICLE_SIZE}px`,
        height: `${PARTICLE_SIZE}px`,
        backgroundColor: coin.color,
        borderRadius: '50%',
        opacity: 1 - coin.explosionProgress, // Fade out
        transform: `scale(${1 - coin.explosionProgress})`, // Shrink
        transition: 'opacity 0.1s ease-out, transform 0.1s ease-out', // Smooth out discrete updates
      };
      particles.push(<div key={i} style={particleStyle} />);
    }

    return (
      <div style={{ ...baseStyle, backgroundColor: 'transparent', boxShadow: 'none' }} aria-label="Coin Exploding"> 
        {particles}
      </div>
    );
  }
  
  if (!coin.collected) {
    return (
      <div
        style={baseStyle}
        role="button" 
        aria-label="Coin"
      />
    );
  }

  return null; // Coin collected and explosion finished (or not exploding)
}
