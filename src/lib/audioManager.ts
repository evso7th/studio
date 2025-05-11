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
  // console.log("[AudioManager] Preloading sounds...");
  for (const name in soundEffects) {
    if (!audioElements[name]) {
      try {
        const config = soundEffects[name];
        const audio = new Audio(config.src);
        audio.loop = config.loop || false;
        audio.volume = config.volume !== undefined ? config.volume : 1.0;
        audio.preload = 'auto'; // browsers handle this well
        audioElements[name] = audio;
      } catch (error) {
        console.error(`[AudioManager] Error preloading sound ${name}:`, error);
      }
    }
  }
  soundsPreloaded = true;
};

const initAudio = (): Promise<void> => {
  return new Promise((resolve) => { // Removed reject, as we want to resolve even if dummy play fails
    if (isAudioContextInitialized) {
      // console.log("[AudioManager] Audio context already initialized.");
      resolve();
      return;
    }
    // console.log("[AudioManager] Attempting to initialize audio context...");
    
    // Try to create an AudioContext directly for modern browsers
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

    // Use a dummy audio element to unlock audio on user gesture (or proactively here)
    let dummyAudio = audioElements['dummy_sound_for_init'];
    if (!dummyAudio) {
        dummyAudio = new Audio();
        dummyAudio.src = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // Short silent WAV
        dummyAudio.muted = true; // Ensure it's muted
        audioElements['dummy_sound_for_init'] = dummyAudio;
    }
    
    const playPromise = dummyAudio.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        dummyAudio.pause(); // Stop the dummy sound once it has served its purpose
        isAudioContextInitialized = true; 
        // console.log("[AudioManager] Audio context initialized successfully by dummy sound play.");
        resolve();
      }).catch(error => {
        console.warn("[AudioManager] Dummy audio play for context init failed:", error.name, error.message);
        // Resolve even if dummy play fails, to not block game start.
        // isAudioContextInitialized remains false, playSound will handle it.
        resolve(); 
      });
    } else {
      // console.warn("[AudioManager] audio.play() did not return a promise. Audio context might not be reliably unlocked.");
      // For older browsers or specific environments, we resolve and hope for the best.
      // isAudioContextInitialized might remain false.
      resolve();
    }
  });
};


const playSound = async (name: string) => {
  if (!soundsPreloaded) {
    preloadSounds();
  }

  if (!isAudioContextInitialized) {
    // console.warn(`[AudioManager] Audio context not initialized for "${name}". Attempting to initialize.`);
    try {
      await initAudio();
      // console.log(`[AudioManager] Context initialization attempted by playSound for "${name}".`);
      // Check again if it was successful
      if (!isAudioContextInitialized) {
        // console.warn(`[AudioManager] Audio context still not initialized after attempt for "${name}". Sound may not play.`);
      }
    } catch (error) { // initAudio now doesn't reject, but good to keep try-catch
      console.error(`[AudioManager] Fallback initAudio process encountered an issue for "${name}":`, error);
      // Do not return here, allow attempt to play if audio element exists
    }
  }

  const audio = audioElements[name];
  if (audio) {
    // console.log(`[AudioManager] Playing sound: ${name}, src: ${audio.src}, currentTime: ${audio.currentTime}, paused: ${audio.paused}, loop: ${audio.loop}`);
    if (!audio.paused) {
      // console.log(`[AudioManager] Sound ${name} is already playing. Pausing and resetting.`);
      audio.pause();
    }
    audio.currentTime = 0; 

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') {
          // console.info(`[AudioManager] Playback of sound "${name}" was interrupted.`);
        } else if (error.name === 'NotAllowedError' && !isAudioContextInitialized) {
          // console.warn(`[AudioManager] Playback of "${name}" prevented by browser policy (NotAllowedError). Audio context likely not unlocked.`);
          // User interaction is likely still needed.
        }
         else {
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
    if (name === 'dummy_sound_for_init') continue; // Don't stop the dummy sound element itself
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

