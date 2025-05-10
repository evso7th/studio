
"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditsDialog } from '@/components/landing/CreditsDialog';
import { useState, useEffect } from 'react';

export default function EntryPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-4 overflow-hidden">
      <div className="text-center space-y-6 max-w-2xl w-full">
        <h1 className="text-5xl md:text-7xl font-bold text-primary">IPO Mad Racing</h1>
        <p className="text-xl md:text-2xl text-foreground/90">
          Специальное издание в честь дня рождения
        </p>
        <p className="text-2xl md:text-3xl font-semibold text-accent">
          Руслана Гайнанова
        </p>

        <div className="relative w-full max-w-md mx-auto aspect-[4/3] my-8">
          <Image
            src="/assets/images/RelaxMan.png" // Assuming this image exists in public/assets/images
            alt="Relaxing Man"
            layout="fill"
            objectFit="contain"
            data-ai-hint="man relaxing business"
            priority
          />
        </div>

        <Button
          onClick={() => router.push('/play')}
          variant="destructive"
          size="lg"
          className="w-full max-w-xs text-xl py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
        >
          Начать игру
        </Button>

        <CreditsDialog />

        <p className="text-md md:text-lg text-muted-foreground pt-6">
          Собери все монетки и выйди на IPO!
          <br />
          Опасайся медведей!
        </p>
      </div>
    </div>
  );
}
