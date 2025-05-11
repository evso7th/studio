"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type React from 'react';

export function FinalScreen() {
  const router = useRouter();

  const handlePlayAgain = () => {
    router.push('/'); 
  };

  const handleCloseGame = () => {
    // Attempt to close the window/tab
    // This might not work in all browsers or if the script didn't open the window
    try {
      const newWindow = window.open('', '_self'); 
      newWindow?.close();
      
      // Fallback if window.close() doesn't work or isn't allowed
      if (newWindow && (newWindow.closed === false || typeof newWindow.closed === 'undefined')) {
        // If it didn't close, or we can't tell, navigate to home
        console.warn("Could not close the tab automatically. Navigating to the entry page.");
        router.push('/');
      } else if (!newWindow) {
        // If newWindow is null (popup blocked, etc.)
        console.warn("Could not open reference to close tab. Navigating to the entry page.");
        router.push('/');
      }
    } catch (e) {
      console.error("Error attempting to close tab:", e);
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-foreground animate-in fade-in duration-300">
      <Image
        src="/assets/images/final.png" 
        alt="Final Screen Background"
        fill
        style={{ objectFit: 'cover', zIndex: -1 }}
        data-ai-hint="victory celebration achievement"
        priority
      />
      <div className="bg-card/70 backdrop-blur-sm text-card-foreground p-8 rounded-xl shadow-2xl text-center max-w-md w-full transform transition-all animate-in fade-in zoom-in-90 duration-500">
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
