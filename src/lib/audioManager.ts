
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
  console.log("Preloading sounds...");
  for (const name in soundEffects) {
    if (!audioElements[name]) {
      const config = soundEffects[name];
      const audio = new Audio(config.src);
      audio.loop = config.loop || false;
      audio.volume = config.volume !== undefined ? config.volume : 1.0;
      audio.preload = 'auto'; // Suggest browser to preload
      // Attempt to load the sound. This can help with caching.
      audio.load();
      audioElements[name] = audio;
    }
  }
  soundsPreloaded = true;
};

const initAudio = () => {
  if (isAudioContextInitialized) return;
  // Attempt to play and immediately pause a dummy sound to initialize audio context on some browsers
  // This is a common workaround for browsers that block autoplay.
  try {
    const dummyAudio = new Audio();
    dummyAudio.play().then(() => {
      dummyAudio.pause();
      isAudioContextInitialized = true;
      console.log("Audio context initialized by user interaction.");
      // If sounds were not playing because context was not init, try playing them now if needed
      // This part is tricky, usually, you'd play sounds *after* init based on game state.
    }).catch(error => {
      // This error is common if the browser still blocks it, but the attempt itself can help.
      console.warn("Dummy audio play for context init failed (this is often ok):", error);
      // We can still set isAudioContextInitialized to true, as the *attempt* was made.
      // Subsequent plays will either work or fail based on browser policy.
      isAudioContextInitialized = true; 
    });
  } catch (error) {
    console.error("Error initializing dummy audio:", error);
    isAudioContextInitialized = true; // Still mark as attempted
  }
};


const playSound = (name: string) => {
  if (!isAudioContextInitialized) {
    console.warn(`Audio context not initialized. Sound "${name}" not played.`);
    return;
  }
  const audio = audioElements[name];
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.error(`Error playing sound ${name}:`, e));
  } else {
    console.warn(`Sound "${name}" not found or not preloaded.`);
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
