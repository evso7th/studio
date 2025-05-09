"use client";

import type { GameAction } from "@/lib/gameTypes";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, ArrowRightCircle, ArrowUpCircle, LogOut } from "lucide-react";
import type { Dispatch } from 'react';

interface ControlPanelProps {
  dispatch: Dispatch<GameAction>;
  onExit: () => void;
}

export function ControlPanel({ dispatch, onExit }: ControlPanelProps) {
  const handleAction = (type: GameAction['type']) => {
    dispatch({ type });
  };

  // Use onMouseDown/onTouchStart and onMouseUp/onTouchEnd for continuous movement
  const handleMoveStart = (type: 'MOVE_LEFT_START' | 'MOVE_RIGHT_START') => {
    dispatch({ type });
  };

  const handleMoveStop = (type: 'MOVE_LEFT_STOP' | 'MOVE_RIGHT_STOP') => {
    dispatch({ type });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-20 bg-[hsl(var(--control-panel-bg))] bg-opacity-80 backdrop-blur-sm shadow-lg p-2 flex items-center justify-around z-50 touch-manipulation"
      style={{ WebkitBackdropFilter: 'blur(4px)' }}
    >
      <Button
        variant="ghost"
        size="lg"
        className="text-foreground hover:bg-primary/20 active:bg-primary/30 p-3 h-16 w-16 rounded-full"
        onMouseDown={() => handleMoveStart('MOVE_LEFT_START')}
        onMouseUp={() => handleMoveStop('MOVE_LEFT_STOP')}
        onTouchStart={() => handleMoveStart('MOVE_LEFT_START')}
        onTouchEnd={() => handleMoveStop('MOVE_LEFT_STOP')}
        aria-label="Move Left"
      >
        <ArrowLeftCircle className="h-10 w-10" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="text-foreground hover:bg-primary/20 active:bg-primary/30 p-3 h-16 w-16 rounded-full"
        onClick={() => handleAction('JUMP')}
        aria-label="Jump"
      >
        <ArrowUpCircle className="h-10 w-10" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="text-foreground hover:bg-primary/20 active:bg-primary/30 p-3 h-16 w-16 rounded-full"
        onMouseDown={() => handleMoveStart('MOVE_RIGHT_START')}
        onMouseUp={() => handleMoveStop('MOVE_RIGHT_STOP')}
        onTouchStart={() => handleMoveStart('MOVE_RIGHT_START')}
        onTouchEnd={() => handleMoveStop('MOVE_RIGHT_STOP')}
        aria-label="Move Right"
      >
        <ArrowRightCircle className="h-10 w-10" />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="text-destructive-foreground bg-destructive/80 hover:bg-destructive active:bg-destructive/90 p-3 h-16 w-16 rounded-full"
        onClick={onExit}
        aria-label="Exit Game"
      >
        <LogOut className="h-8 w-8" />
      </Button>
    </div>
  );
}
