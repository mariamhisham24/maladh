import React, { createContext, useContext, useState } from 'react';
import { serenityPlayer, SERENITY_SOUNDS, type SoundItemMeta, type SoundCategory } from '../utils/ambientAudio';

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentSoundId: string;
  currentItem: SoundItemMeta;
  isPlaying: boolean;
  volume: number;
  timerMinutes: number;
  activeCategory: SoundCategory | 'all';
  setActiveCategory: (cat: SoundCategory | 'all') => void;
  playSound: (id?: string) => void;
  stopSound: () => void;
  togglePlay: () => void;
  changeVolume: (v: number) => void;
  changeTimer: (m: number) => void;
  sounds: SoundItemMeta[];
  currentSound: string;
  soundMetaList: SoundItemMeta[];
  currentMeta: SoundItemMeta;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const STORAGE_SOUND_ENABLED = 'maladh_sound_enabled';
const STORAGE_SOUND_ID = 'maladh_sound_id';
const STORAGE_SOUND_VOLUME = 'maladh_sound_volume';

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_SOUND_ENABLED) === 'true';
  });

  const [currentSoundId, setCurrentSoundId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_SOUND_ID);
    return saved || 'quran_rahman';
  });

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_SOUND_VOLUME);
    return saved !== null ? parseFloat(saved) : 0.6;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<SoundCategory | 'all'>('all');

  const currentItem = SERENITY_SOUNDS.find((s) => s.id === currentSoundId) || SERENITY_SOUNDS[0];

  const changeVolume = (v: number) => {
    setVolumeState(v);
    serenityPlayer.setVolume(v);
    localStorage.setItem(STORAGE_SOUND_VOLUME, String(v));
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(STORAGE_SOUND_ENABLED, String(enabled));
    if (!enabled && isPlaying) {
      stopSound();
    }
  };

  const playSound = (id?: string) => {
    const targetId = id || currentSoundId;
    setCurrentSoundId(targetId);
    localStorage.setItem(STORAGE_SOUND_ID, targetId);

    setSoundEnabledState(true);
    localStorage.setItem(STORAGE_SOUND_ENABLED, 'true');

    const item = SERENITY_SOUNDS.find((s) => s.id === targetId) || SERENITY_SOUNDS[0];
    serenityPlayer.play(item, volume);

    if (timerMinutes > 0) {
      serenityPlayer.setTimer(timerMinutes, () => {
        setIsPlaying(false);
      });
    }
    setIsPlaying(true);
  };

  const stopSound = () => {
    serenityPlayer.stop();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopSound();
    } else {
      playSound(currentSoundId);
    }
  };

  const changeTimer = (m: number) => {
    setTimerMinutes(m);
    serenityPlayer.setTimer(m, () => {
      setIsPlaying(false);
    });
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        currentSoundId,
        currentItem,
        isPlaying,
        volume,
        timerMinutes,
        activeCategory,
        setActiveCategory,
        playSound,
        stopSound,
        togglePlay,
        changeVolume,
        changeTimer,
        sounds: SERENITY_SOUNDS,
        currentSound: currentSoundId,
        soundMetaList: SERENITY_SOUNDS,
        currentMeta: currentItem,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
