
"use client";
import type { HeroType, PlatformType, CoinType } from "@/lib/gameTypes";
// import { COIN_SPAWN_EXPLOSION_DURATION_MS } from "@/lib/gameTypes"; // Not directly used, COIN_EXPLOSION_DURATION_MS is used
import type React from 'react'; 

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
  heroFacingDirection?: HeroType['facingDirection'];
  appearanceProps?: AppearanceProps;
  shape?: 'rect' | 'circle';
  isHero?: boolean; 
  isPlatform?: boolean; // Added to identify platforms specifically
}

function getGameObjectStyle({ x, y, width, height, gameAreaHeight, paddingTop, color, heroAction, heroFacingDirection, appearanceProps, shape = 'rect', isHero = false, isPlatform = false }: GameObjectStylePropsBase): React.CSSProperties {
  const topInEffectiveArea = gameAreaHeight - y - height;
  const finalCssTop = paddingTop + topInEffectiveArea;
  
  let dynamicStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${finalCssTop}px`, 
    width: `${width}px`,
    height: `${height}px`,
    objectFit: 'fill', 
  };

  if (!isHero && !isPlatform) { // Apply shadow only if not hero and not platform
    // dynamicStyles.boxShadow = '2px 2px 4px rgba(0,0,0,0.3)'; // Shadow removed for platforms and hero
  }

  if (color) { 
    dynamicStyles.backgroundColor = color;
  }
  
  let baseTransform = '';
  if (isHero) {
    if (heroFacingDirection === 'left') {
      baseTransform = 'scaleX(-1)';
    } else { // 'right' or undefined (default to right)
      baseTransform = 'scaleX(1)';
    }
  }
  
  let animationTransform = '';

  if (appearanceProps?.type === 'heroAppear') {
    const progress = appearanceProps.progress;
    dynamicStyles.opacity = progress;
    animationTransform = `scale(${progress})`; // This scale is for appearance, not related to jump/fall x-squash
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
          // The scaleX here is for the jump animation itself, applied after directional flip
          animationTransform = `scaleY(0.95) translateY(-3px) scaleX(1.05)`; 
          dynamicStyles.transition = 'transform 0.1s ease-out';
          break;
        case 'fall_down':
          // The scaleX here is for the fall animation
          animationTransform = `scaleY(1.05) translateY(1px) scaleX(0.95)`; 
          dynamicStyles.transition = 'transform 0.1s ease-in';
          break;
        case 'run_left':
        case 'run_right':
        case 'idle':
          animationTransform = ''; // No additional animation transform for these states
          break;
        default: 
          animationTransform = '';
          break;
      }
    }
  }
  
  const combinedTransform = `${baseTransform} ${animationTransform}`.trim();
  if (combinedTransform) {
    dynamicStyles.transform = combinedTransform;
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
    <img
      src="https://neurostaffing.online/wp-content/uploads/2025/05/HeroJeans3.png"
      alt="Hero"
      style={getGameObjectStyle({ 
        ...hero, 
        gameAreaHeight, 
        paddingTop, 
        heroAction: hero.action,
        heroFacingDirection: hero.facingDirection,
        appearanceProps,
        isHero: true, 
      })}
      role="img"
      aria-label="Hero"
      data-ai-hint="character fantasy"
    />
  );
}

export function PlatformComponent({ platform, gameAreaHeight, paddingTop }: { platform: PlatformType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null;
  
  const baseStyle = getGameObjectStyle({ 
    ...platform, 
    gameAreaHeight, 
    paddingTop, 
    color: undefined, // Platform image will be used
    shape: 'rect',
    isPlatform: true, // Indicate that this is a platform
  });
  
  const platformStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundImage: platform.id === 'platform_ground' 
      ? 'url("https://neurostaffing.online/wp-content/uploads/2025/05/GroundFloor.png")' 
      : 'url("https://neurostaffing.online/wp-content/uploads/2025/05/PlatformGrassShort.png")',
    backgroundSize: platform.id === 'platform_ground' ? 'auto 100%' : '100% 100%', // Ground repeats, others stretch
    backgroundPosition: platform.id === 'platform_ground' ? 'left bottom' : 'center', // Ground tiles from left
    backgroundRepeat: platform.id === 'platform_ground' ? 'repeat-x' : 'no-repeat', 
    // boxShadow: 'none', // Explicitly remove box shadow for platforms
  };

  return (
    <div
      style={platformStyle}
      role="presentation" 
      data-ai-hint={platform.id === 'platform_ground' ? "stone ground" : "grass platform"}
    />
  );
}


const NUM_PARTICLES = 8;
const PARTICLE_SIZE = 5; 
const EXPLOSION_SPREAD_RADIUS = 40; 

export function CoinComponent({ coin, gameAreaHeight, paddingTop }: { coin: CoinType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null;

  const baseStyle = getGameObjectStyle({ 
    ...coin, 
    gameAreaHeight, 
    paddingTop, 
    shape: 'circle' 
  });

  // SPAWN EXPLOSION
  if (coin.isSpawning && coin.spawnExplosionProgress != null && coin.spawnExplosionProgress < 1) {
    const particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const angle = (i / NUM_PARTICLES) * 2 * Math.PI + (Math.random() - 0.5) * 0.5; 
      const distance = EXPLOSION_SPREAD_RADIUS * coin.spawnExplosionProgress * (0.5 + Math.random() * 0.5); 
      const particleX = Math.cos(angle) * distance;
      const particleY = Math.sin(angle) * distance;
      const particleStyle: React.CSSProperties = {
        position: 'absolute',
        left: `calc(50% + ${particleX}px - ${PARTICLE_SIZE / 2}px)`, 
        top: `calc(50% + ${particleY}px - ${PARTICLE_SIZE / 2}px)`,  
        width: `${PARTICLE_SIZE}px`,
        height: `${PARTICLE_SIZE}px`,
        backgroundColor: 'hsl(var(--accent))', // Use a different color for spawn, e.g., accent
        borderRadius: '50%',
        opacity: 1 - coin.spawnExplosionProgress, 
        transform: `scale(${1 - coin.spawnExplosionProgress})`, 
        transition: 'opacity 0.1s ease-out, transform 0.1s ease-out', 
      };
      particles.push(<div key={`spawn_particle_${i}`} style={particleStyle} />);
    }
    const explosionContainerStyle: React.CSSProperties = {
        position: 'absolute',
        left: baseStyle.left,
        top: baseStyle.top,
        width: baseStyle.width,
        height: baseStyle.height,
    };
    return (
      <div style={explosionContainerStyle} aria-label="Coin Spawning" data-ai-hint="sparkle effect"> 
        {particles}
      </div>
    );
  }
  
  // COLLECTION EXPLOSION
  if (coin.isExploding && coin.collected && coin.explosionProgress != null && coin.explosionProgress < 1) {
    const particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const angle = (i / NUM_PARTICLES) * 2 * Math.PI + (Math.random() - 0.5) * 0.5; 
      const distance = EXPLOSION_SPREAD_RADIUS * coin.explosionProgress * (0.5 + Math.random() * 0.5); 
      const particleX = Math.cos(angle) * distance;
      const particleY = Math.sin(angle) * distance;
      const particleStyle: React.CSSProperties = {
        position: 'absolute',
        left: `calc(50% + ${particleX}px - ${PARTICLE_SIZE / 2}px)`, 
        top: `calc(50% + ${particleY}px - ${PARTICLE_SIZE / 2}px)`,  
        width: `${PARTICLE_SIZE}px`,
        height: `${PARTICLE_SIZE}px`,
        backgroundColor: 'hsl(var(--coin-color))', 
        borderRadius: '50%',
        opacity: 1 - coin.explosionProgress, 
        transform: `scale(${1 - coin.explosionProgress})`, 
        transition: 'opacity 0.1s ease-out, transform 0.1s ease-out', 
      };
      particles.push(<div key={`collect_particle_${i}`} style={particleStyle} />);
    }
    const explosionContainerStyle: React.CSSProperties = {
        position: 'absolute',
        left: baseStyle.left,
        top: baseStyle.top,
        width: baseStyle.width,
        height: baseStyle.height,
    };
    return (
      <div style={explosionContainerStyle} aria-label="Coin Exploding" data-ai-hint="gold sparkle"> 
        {particles}
      </div>
    );
  }
  
  // RENDER COIN IMAGE (only if not collected and fully spawned)
  if (!coin.collected && !coin.isSpawning) { 
    return (
      <img
        src="https://neurostaffing.online/wp-content/uploads/2025/04/Спасибка1.png"
        alt="Coin"
        className="animate-rotate-y animate-coin-glow"
        style={baseStyle} 
        role="img" 
        aria-label="Coin"
        data-ai-hint="gold coin"
      />
    );
  }

  return null; 
}

