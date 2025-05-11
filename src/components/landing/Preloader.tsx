"use client";
import type React from 'react';

export function Preloader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[100]">
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-primary animate-pulse"></div>
        <div className="w-8 h-8 bg-accent animate-pulse animation-delay-200"></div>
        <div className="w-8 h-8 bg-secondary animate-pulse animation-delay-400"></div>
      </div>
      <p className="mt-4 text-lg text-foreground">Загрузка игры...</p>
    </div>
  );
}