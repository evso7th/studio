
"use client";
import type { HeroType, PlatformType, CoinType } from "@/lib/gameTypes";
import type React from 'react'; // Ensure React is imported for JSX

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
  color?: string; // Optional: used for fallback or non-image elements
  heroAction?: HeroType['action'];
  appearanceProps?: AppearanceProps;
  shape?: 'rect' | 'circle';
  isHero?: boolean; // Added to identify hero for specific styling
}

function getGameObjectStyle({ x, y, width, height, gameAreaHeight, paddingTop, color, heroAction, appearanceProps, shape = 'rect', isHero = false }: GameObjectStylePropsBase): React.CSSProperties {
  const topInEffectiveArea = gameAreaHeight - y - height;
  const finalCssTop = paddingTop + topInEffectiveArea;
  
  let dynamicStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${finalCssTop}px`, 
    width: `${width}px`,
    height: `${height}px`,
    objectFit: 'fill', // For img tags, to fill the dimensions
  };

  if (!isHero) { // Apply shadow only if not hero
    dynamicStyles.boxShadow = '2px 2px 4px rgba(0,0,0,0.3)';
  }


  if (color) { // Only set if color is provided and it's not an image that will cover it
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

    // Action-based animations (primarily for hero if it were a div, might be less relevant for img)
    if (heroAction) {
      switch (heroAction) {
        case 'jump_up':
          dynamicStyles.transform = `scaleY(0.95) translateY(-3px) scaleX(1.05)`; // Adjusted for image
          dynamicStyles.transition = 'transform 0.1s ease-out';
          break;
        case 'fall_down':
          dynamicStyles.transform = `scaleY(1.05) translateY(1px) scaleX(0.95)`; // Adjusted for image
          dynamicStyles.transition = 'transform 0.1s ease-in';
          break;
        // Running animations might be better handled by swapping images or CSS sprite if available
        case 'run_left':
        case 'run_right':
          dynamicStyles.transform = 'none'; 
          break;
        default: 
          dynamicStyles.transform = 'none';
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
    <img
      src="https://neurostaffing.online/wp-content/uploads/2025/05/HeroJeans3.png"
      alt="Hero"
      style={getGameObjectStyle({ 
        ...hero, 
        gameAreaHeight, 
        paddingTop, 
        // No color prop, image is used
        heroAction: hero.action,
        appearanceProps,
        isHero: true, // Identify as hero
        // shape: 'rect' // borderRadius will be applied from default
      })}
      role="img"
      aria-label="Hero"
      data-ai-hint="character fantasy"
    />
  );
}

export function PlatformComponent({ platform, gameAreaHeight, paddingTop }: { platform: PlatformType } & GameObjectComponentProps) {
  if (!gameAreaHeight && gameAreaHeight !== 0) return null;
  
  // Pass undefined for color to prevent getGameObjectStyle from setting a backgroundColor
  // that might interfere with the backgroundImage.
  const baseStyle = getGameObjectStyle({ 
    ...platform, 
    gameAreaHeight, 
    paddingTop, 
    color: undefined, // Explicitly no color for textured platforms
    shape: 'rect' 
  });
  
  const platformStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundImage: 'url("https://neurostaffing.online/wp-content/uploads/2025/05/PlatformGrassShort.png")',
    backgroundSize: '100% 100%', // Stretch to fit the platform dimensions
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat', // Ensure texture doesn't repeat if it's smaller
  };

  return (
    <div
      style={platformStyle}
      role="presentation" 
      data-ai-hint="grass platform"
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
    // No color for the image itself
    shape: 'circle' // Affects borderRadius of the img tag
  });

  if (coin.isExploding && coin.explosionProgress != null && coin.explosionProgress < 1) {
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
        backgroundColor: 'hsl(var(--coin-color))', // Particles retain a color
        borderRadius: '50%',
        opacity: 1 - coin.explosionProgress, 
        transform: `scale(${1 - coin.explosionProgress})`, 
        transition: 'opacity 0.1s ease-out, transform 0.1s ease-out', 
      };
      particles.push(<div key={i} style={particleStyle} />);
    }

    // Position the particle container where the coin was
    const explosionContainerStyle: React.CSSProperties = {
        position: 'absolute',
        left: baseStyle.left,
        top: baseStyle.top,
        width: baseStyle.width,
        height: baseStyle.height,
        // Particles are absolutely positioned relative to this container
    };

    return (
      <div style={explosionContainerStyle} aria-label="Coin Exploding" data-ai-hint="gold sparkle"> 
        {particles}
      </div>
    );
  }
  
  if (!coin.collected) { // Render coin image if not collected and not exploding
    return (
      <img
        src="https://neurostaffing.online/wp-content/uploads/2025/04/Спасибка1.png"
        alt="Coin"
        style={baseStyle} // Applies position, size, and 'circle' border radius
        role="img" // Changed from button to img
        aria-label="Coin"
        data-ai-hint="gold coin"
      />
    );
  }

  return null; 
}

