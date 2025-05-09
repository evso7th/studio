
"use client";

import type { GameAction } from "@/lib/gameTypes";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, ArrowUpCircle, ArrowRightCircle, LogOut } from "lucide-react";
import type { Dispatch } from 'react';

interface ControlPanelProps {
  dispatch: Dispatch<GameAction>;
  onExit: () => void;
  disabled?: boolean; // Added to disable controls
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
    // Stop actions should still be processed even if disabled mid-action, to prevent sticky keys
    dispatch({ type });
  };

  const commonButtonStyles = "p-3 h-16 w-16 rounded-full text-destructive-foreground bg-destructive/80 hover:bg-destructive active:bg-destructive/90 disabled:opacity-100 disabled:bg-transparent disabled:border disabled:border-destructive disabled:text-destructive disabled:text-opacity-70";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-20 bg-[hsl(var(--control-panel-bg))] bg-opacity-80 backdrop-blur-sm shadow-lg p-2 flex items-center justify-around z-50 touch-manipulation"
      style={{ WebkitBackdropFilter: 'blur(4px)' }}
    >
      <Button
        variant="ghost"
        size="lg"
        className={commonButtonStyles}
        onMouseDown={() => handleMoveStart('MOVE_LEFT_START')}
        onMouseUp={() => handleMoveStop('MOVE_LEFT_STOP')}
        onTouchStart={() => handleMoveStart('MOVE_LEFT_START')}
        onTouchEnd={() => handleMoveStop('MOVE_LEFT_STOP')}
        aria-label="Move Left"
        disabled={disabled}
      >
        <ArrowLeftCircle className="h-32 w-32 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className={commonButtonStyles}
        onClick={() => handleAction('JUMP')}
        aria-label="Jump"
        disabled={disabled}
      >
        <ArrowUpCircle className="h-32 w-32 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className={commonButtonStyles}
        onMouseDown={() => handleMoveStart('MOVE_RIGHT_START')}
        onMouseUp={() => handleMoveStop('MOVE_RIGHT_STOP')}
        onTouchStart={() => handleMoveStart('MOVE_RIGHT_START')}
        onTouchEnd={() => handleMoveStop('MOVE_RIGHT_STOP')}
        aria-label="Move Right"
        disabled={disabled}
      >
        <ArrowRightCircle className="h-32 w-32 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className={commonButtonStyles}
        onClick={onExit}
        aria-label="Exit Game"
        // Exit button should ideally not be disabled by game state
      >
        <LogOut className="h-32 w-32 text-foreground" />
      </Button>
    </div>
  );
}

