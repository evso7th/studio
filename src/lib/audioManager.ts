
// @ts-nocheck
"use client";

interface SoundConfig {
  src: string;
  loop?: boolean;
  volume?: number;
}

// Define a type for audio elements that might have our custom handler
interface ExtendedHTMLAudioElement extends HTMLAudioElement {
  // No custom handler needed for this approach, but keeping for potential future use
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
  exit: { src: '/assets/sounds/exit.mp3', volume: 0.6 },
};

const audioElements: Record<string, ExtendedHTMLAudioElement> = {};
let isAudioContextInitialized = false;
let soundsPreloaded = false;

const preloadSounds = () => {
  if (soundsPreloaded) return;
  // console.log("[AudioManager] Preloading sounds...");
  for (const name in soundEffects) {
    if (!audioElements[name]) {
      try {
        const config = soundEffects[name];
        const audio = new Audio(config.src) as ExtendedHTMLAudioElement;
        audio.loop = false; // Disable native loop, we'll handle it manually for seamlessness
        audio.volume = config.volume !== undefined ? config.volume : 1.0;
        audio.preload = 'auto'; // Ensure entire audio is buffered
        audioElements[name] = audio;

        // Custom loop handler for sounds marked with loop: true
        if (config.loop) {
          audio.addEventListener('ended', function(this: ExtendedHTMLAudioElement) {
            this.currentTime = 0;
            this.play().catch(e => console.warn(`[AudioManager] Custom loop restart for ${name} failed:`, e.name, e.message));
          });
        }

      } catch (error) {
        console.error(`[AudioManager] Error preloading sound ${name}:`, error);
      }
    }
  }
  soundsPreloaded = true;
};

const initAudio = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isAudioContextInitialized) {
      resolve();
      return;
    }
    
    try {
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        if (context.state === 'suspended') {
          context.resume().then(() => {
            // console.log("[AudioManager] AudioContext resumed on creation.");
          }).catch(e => console.warn("[AudioManager] AudioContext resume on creation failed:", e));
        }
      }
    } catch (e) {
      // console.warn("[AudioManager] Could not create AudioContext directly:", e);
    }

    let dummyAudio = audioElements['dummy_sound_for_init'];
    if (!dummyAudio) {
        dummyAudio = new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA") as ExtendedHTMLAudioElement;
        dummyAudio.muted = true; 
        audioElements['dummy_sound_for_init'] = dummyAudio;
    }
    
    const playPromise = dummyAudio.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        dummyAudio.pause(); 
        isAudioContextInitialized = true; 
        resolve();
      }).catch(error => {
        console.warn("[AudioManager] Dummy audio play for context init failed:", error.name, error.message);
        resolve(); 
      });
    } else {
      // For browsers that don't return a promise from play() or if it's not supported.
      // We assume initialization if no immediate error is thrown, or rely on user interaction.
      isAudioContextInitialized = true; // Tentatively set to true, subsequent plays will confirm
      resolve();
    }
  });
};


const playSound = async (name: string) => {
  if (!soundsPreloaded) {
    preloadSounds();
  }

  if (!isAudioContextInitialized) {
    try {
      await initAudio();
      if (!isAudioContextInitialized) {
        // console.warn(`[AudioManager] Audio context still not initialized after attempt for "${name}". Sound may not play.`);
      }
    } catch (error) { 
      console.error(`[AudioManager] Fallback initAudio process encountered an issue for "${name}":`, error);
    }
  }

  const audio = audioElements[name];
  if (audio) {
    // If it's a non-looping sound and already playing, restart it.
    // If it's a looping sound (handled by 'ended' event) and already playing, let it be.
    // If it's paused, always reset currentTime and play.
    const isLoopingSound = soundEffects[name]?.loop || false;

    if (!audio.paused && !isLoopingSound) { // Non-looping sound currently playing
      audio.pause();
      audio.currentTime = 0;
    } else if (audio.paused) { // Sound is paused (looping or not)
      audio.currentTime = 0;
    }
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') {
          // console.info(`[AudioManager] Playback of sound "${name}" was interrupted.`);
        } else if (error.name === 'NotAllowedError' && !isAudioContextInitialized) {
          // console.warn(`[AudioManager] Playback of "${name}" prevented by browser policy (NotAllowedError). Audio context likely not unlocked.`);
        } else {
          console.error(`[AudioManager] Error playing sound "${name}" (src: ${audio.src}):`, error.name, error.message);
        }
      });
    }
  } else {
    // console.warn(`[AudioManager] Sound "${name}" not found. Available: ${Object.keys(audioElements).join(', ')}`);
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
    if (name === 'dummy_sound_for_init') continue; 
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

