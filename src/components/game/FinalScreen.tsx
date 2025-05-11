
"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type React from 'react';
import { useEffect } from 'react';
import { audioManager } from '@/lib/audioManager';

export function FinalScreen() {
  const router = useRouter();

  useEffect(() => {
    audioManager.stopAllSounds();
    audioManager.playSound('final_screen');
    return () => {
      audioManager.stopSound('final_screen');
    };
  }, []);

  const handlePlayAgain = () => {
    audioManager.stopSound('final_screen');
    router.push('/'); 
  };

  const handleCloseGame = () => {
    audioManager.stopSound('final_screen');
    try {
      const newWindow = window.open('', '_self'); 
      newWindow?.close();
      
      if (newWindow && (newWindow.closed === false || typeof newWindow.closed === 'undefined')) {
        console.warn("Could not close the tab automatically. Navigating to the entry page.");
        router.push('/');
      } else if (!newWindow) {
        console.warn("Could not open reference to close tab. Navigating to the entry page.");
        router.push('/');
      }
    } catch (e) {
      console.error("Error attempting to close tab:", e);
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-foreground animate-in fade-in duration-1000">
      <Image
        src="/assets/images/final.png" 
        alt="Final Screen Background"
        fill
        style={{ objectFit: 'cover', zIndex: -1 }}
        data-ai-hint="victory celebration achievement"
        priority
      />
      <div className="bg-card/70 backdrop-blur-sm text-card-foreground p-8 rounded-xl shadow-2xl text-center max-w-md w-full transform transition-all animate-in fade-in zoom-in-90 duration-1000">
        <h1 className="text-4xl font-bold text-primary mb-4">Поздравляем!</h1>
        <p className="text-xl text-foreground/90 mb-2">Главный приз - ваш!</p>
        <p className="text-xl text-foreground/90 mb-2">Смело идите на IPO!</p>
        <p className="text-xl text-foreground/90 mb-8">Вас ждет успех!</p>

        <div className="flex flex-col space-y-4">
          <Button
            onClick={handlePlayAgain}
            variant="destructive"
            size="lg"
            className="text-lg py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Играть снова
          </Button>
          <Button
            onClick={handleCloseGame}
            variant="outline"
            size="lg"
            className="text-lg py-3 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Закрыть игру
          </Button>
        </div>
      </div>
    </div>
  );
}
