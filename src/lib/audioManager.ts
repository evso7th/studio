// @ts-nocheck
"use client";

interface SoundConfig {
  src: string;
  loop?: boolean;
  volume?: number;
}

const soundEffects: Record<string, SoundConfig> = {
  Hero_jump1: { src: '/assets/sounds/Hero_jump1.mp3', volume: 0.5 },
  Hero_fail: { src: '/assets/sounds/Hero_fail.mp3', volume: 0.6 },
  Coin_splash: { src: '/assets/sounds/Coin_splash.mp3', volume: 0.4 },
  takecoin: { src: '/assets/sounds/takecoin.mp3', volume: 0.5 },
  allcoins: { src: '/assets/sounds/allcoins.mp3', volume: 0.7 },
  First_screen: { src: '/assets/sounds/First_screen.mp3', loop: true, volume: 0.3 },
  New_level: { src: '/assets/sounds/New_level.mp3', volume: 0.6 },
  Level1: { src: '/assets/sounds/Level1.mp3', loop: true, volume: 0.25 },
  Level2: { src: '/assets/sounds/Level2.mp3', loop: true, volume: 0.25 },
  Level3: { src: '/assets/sounds/Level3.mp3', loop: true, volume: 0.25 },
  final_screen: { src: '/assets/sounds/final_screen.mp3', loop: true, volume: 0.4 },
  bear_voice: { src: '/assets/sounds/bear_voice.mp3', volume: 0.7 },
};

const audioElements: Record<string, HTMLAudioElement> = {};
let isAudioContextInitialized = false;
let soundsPreloaded = false;

const preloadSounds = () => {
  if (soundsPreloaded) return;
  console.log("[AudioManager] Preloading sounds...");
  for (const name in soundEffects) {
    if (!audioElements[name]) {
      try {
        const config = soundEffects[name];
        const audio = new Audio(config.src);
        audio.loop = config.loop || false;
        audio.volume = config.volume !== undefined ? config.volume : 1.0;
        audio.preload = 'auto';
        audioElements[name] = audio;
        // console.log(`[AudioManager] Preloaded: ${name} from ${config.src}`); // Reduce console noise
      } catch (error) {
        console.error(`[AudioManager] Error preloading sound ${name}:`, error);
      }
    }
  }
  soundsPreloaded = true;
};

const initAudio = () => {
  if (isAudioContextInitialized) {
    // console.log("[AudioManager] Audio context already initialized."); // Reduce console noise
    return;
  }
  // console.log("[AudioManager] Attempting to initialize audio context..."); // Reduce console noise
  
  const dummyAudio = new Audio();
  dummyAudio.src = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; 
  dummyAudio.muted = true; 

  const playPromise = dummyAudio.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      dummyAudio.pause(); 
      isAudioContextInitialized = true; 
      console.log("[AudioManager] Audio context initialized successfully by user interaction.");
    }).catch(error => {
      console.warn("[AudioManager] Dummy audio play for context init failed:", error.name, error.message);
    });
  } else {
    console.warn("[AudioManager] audio.play() did not return a promise. Audio context might not be reliably unlocked.");
  }
};


const playSound = (name: string) => {
  if (!isAudioContextInitialized) {
    console.warn(`[AudioManager] Audio context not initialized. Sound "${name}" not played.`);
    return;
  }
  const audio = audioElements[name];
  if (audio) {
    // If the audio is not paused, pause it first.
    // This handles cases where play() might be called on an already playing sound,
    // or a sound that was just played and its promise hasn't fully settled.
    if (!audio.paused) {
        audio.pause(); // Explicitly pause before attempting to play again.
    }
    // It's generally safe to set currentTime on a paused audio element.
    audio.currentTime = 0; // Reset playback to the beginning for a fresh play.

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // AbortError is expected if another action (like pause or another play on the same element) interrupts this one.
        // Log it as info because it's often a normal part of rapid sound transitions.
        if (error.name === 'AbortError') {
          // console.info(`[AudioManager] Playback of sound "${name}" was interrupted. This is usually due to rapid sound transitions or stopping the sound.`); // Reduce console noise for this common case
        } else {
          console.error(`[AudioManager] Error playing sound "${name}" (src: ${audio.src}):`, error.name, error.message);
        }
      });
    }
  } else {
    console.warn(`[AudioManager] Sound "${name}" not found in preloaded audioElements. Available sounds: ${Object.keys(audioElements).join(', ')}`);
  }
};

const stopSound = (name: string) => {
  const audio = audioElements[name];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

const stopAllSounds = () => {
  for (const name in audioElements) {
    stopSound(name);
  }
};

const setVolume = (name: string, volume: number) => {
  const audio = audioElements[name];
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, volume));
  }
};

export const audioManager = {
  preloadSounds,
  initAudio,
  playSound,
  stopSound,
  stopAllSounds,
  setVolume,
  isInitialized: () => isAudioContextInitialized,
};
