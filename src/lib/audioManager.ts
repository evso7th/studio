
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
        // audio.load(); // Explicitly calling load() can sometimes help
        audioElements[name] = audio;
        console.log(`[AudioManager] Preloaded: ${name} from ${config.src}`);
      } catch (error) {
        console.error(`[AudioManager] Error preloading sound ${name}:`, error);
      }
    }
  }
  soundsPreloaded = true;
};

const initAudio = () => {
  if (isAudioContextInitialized) {
    console.log("[AudioManager] Audio context already initialized.");
    return;
  }
  console.log("[AudioManager] Attempting to initialize audio context...");
  
  const dummyAudio = new Audio();
  // It's good practice to play a very short, silent audio clip or an empty src for unlocking.
  // An empty src might not work in all browsers, a tiny silent WAV/MP3 is more robust.
  // dummyAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // Example tiny silent WAV
  dummyAudio.muted = true; // Play muted to avoid any sound artifact if it's not truly silent

  const playPromise = dummyAudio.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      // Successfully played (even if muted/silent), context is likely unlocked
      dummyAudio.pause(); // Stop the dummy audio
      isAudioContextInitialized = true; // Set flag ONLY on success
      console.log("[AudioManager] Audio context initialized successfully by user interaction.");
    }).catch(error => {
      console.warn("[AudioManager] Dummy audio play for context init failed. Sounds might not play until further user interaction or if browser restrictions are strict:", error);
      // isAudioContextInitialized remains false, subsequent playSound calls will warn.
    });
  } else {
    // Fallback for very old browsers that don't return a Promise from play()
    // This is less common now.
    console.warn("[AudioManager] audio.play() did not return a promise. Audio context might not be reliably unlocked on this browser. Assuming unlocked for compatibility.");
    isAudioContextInitialized = true; // Less certain, but a possible fallback path
  }
};


const playSound = (name: string) => {
  if (!isAudioContextInitialized) {
    console.warn(`[AudioManager] Audio context not initialized. Sound "${name}" not played.`);
    return;
  }
  const audio = audioElements[name];
  if (audio) {
    audio.currentTime = 0; 
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => { // Catch errors for individual sound plays
        console.error(`[AudioManager] Error playing sound "${name}" (src: ${audio.src}):`, error);
      });
    }
    // console.log(`[AudioManager] Attempting to play sound: ${name}`);
  } else {
    console.warn(`[AudioManager] Sound "${name}" not found in preloaded audioElements. Available sounds: ${Object.keys(audioElements).join(', ')}`);
  }
};

const stopSound = (name: string) => {
  const audio = audioElements[name];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    // console.log(`[AudioManager] Stopped sound: ${name}`);
  }
};

const stopAllSounds = () => {
  // console.log("[AudioManager] Stopping all sounds.");
  for (const name in audioElements) {
    stopSound(name);
  }
};

const setVolume = (name: string, volume: number) => {
  const audio = audioElements[name];
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, volume));
    // console.log(`[AudioManager] Set volume for ${name} to ${audio.volume}`);
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

