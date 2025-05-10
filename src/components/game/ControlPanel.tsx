
"use client";

import type { GameAction } from "@/lib/gameTypes";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, ArrowUpCircle, ArrowRightCircle, LogOut } from "lucide-react";
import type { Dispatch } from 'react';

interface ControlPanelProps {
  dispatch: Dispatch<GameAction>;
  onExit: () => void;
  disabled?: boolean;
}

export function ControlPanel({ dispatch, onExit, disabled = false }: ControlPanelProps) {
  const handleAction = (type: GameAction['type']) => {
    if (disabled) return;
    dispatch({ type });
  };

  const handleMoveStart = (type: 'MOVE_LEFT_START' | 'MOVE_RIGHT_START') => {
    if (disabled) return;
    dispatch({ type });
  };

  const handleMoveStop = (type: 'MOVE_LEFT_STOP' | 'MOVE_RIGHT_STOP') => {
    // Always allow move stop to prevent stuck state if controls become disabled while key/button is pressed
    dispatch({ type });
  };

  const commonButtonStyles = "p-3 h-16 w-16 rounded-full text-foreground shadow-lg hover:shadow-xl active:shadow-lg active:translate-y-px transition-all duration-150 ease-in-out";
  const disabledButtonStyles = "disabled:opacity-70 disabled:bg-transparent disabled:border disabled:border-destructive disabled:text-destructive disabled:shadow-none disabled:cursor-not-allowed";
  
  const getRadialGradientStyle = (isDisabled: boolean) => !isDisabled ? { backgroundImage: 'radial-gradient(circle, #f48c25, #e74210)' } : {};


  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-20 shadow-lg p-2 flex items-center justify-around z-50 touch-manipulation"
      style={{ 
        backgroundImage: 'url("https://neurostaffing.online/wp-content/uploads/2025/05/GroundFloor.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center left',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'transparent', 
       }}
       data-ai-hint="stone texture"
    >
      <Button
        variant="ghost"
        size="lg"
        className={`${commonButtonStyles} ${disabled ? disabledButtonStyles : ''}`}
        style={getRadialGradientStyle(disabled)}
        onMouseDown={() => handleMoveStart('MOVE_LEFT_START')}
        onMouseUp={() => handleMoveStop('MOVE_LEFT_STOP')}
        onTouchStart={() => handleMoveStart('MOVE_LEFT_START')}
        onTouchEnd={() => handleMoveStop('MOVE_LEFT_STOP')}
        aria-label="Move Left"
        disabled={disabled}
      >
        <ArrowLeftCircle className="h-12 w-12 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className={`${commonButtonStyles} ${disabled ? disabledButtonStyles : ''}`}
        style={getRadialGradientStyle(disabled)}
        onClick={() => handleAction('JUMP')}
        aria-label="Jump"
        disabled={disabled}
      >
        <ArrowUpCircle className="h-12 w-12 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className={`${commonButtonStyles} ${disabled ? disabledButtonStyles : ''}`}
        style={getRadialGradientStyle(disabled)}
        onMouseDown={() => handleMoveStart('MOVE_RIGHT_START')}
        onMouseUp={() => handleMoveStop('MOVE_RIGHT_STOP')}
        onTouchStart={() => handleMoveStart('MOVE_RIGHT_START')}
        onTouchEnd={() => handleMoveStop('MOVE_RIGHT_STOP')}
        aria-label="Move Right"
        disabled={disabled}
      >
        <ArrowRightCircle className="h-12 w-12 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className={`${commonButtonStyles} ${disabled ? disabledButtonStyles : ''}`}
        style={getRadialGradientStyle(disabled)} 
        onClick={onExit}
        aria-label="Выход в меню"
        disabled={disabled}
      >
        <LogOut className="h-12 w-12 text-foreground" />
      </Button>
    </div>
  );
}
