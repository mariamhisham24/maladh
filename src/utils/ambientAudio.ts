// Enhanced Audio Engine for Maladh: Bundled Offline Nature MP3s, Pure Quranic Recitations & 432Hz Serenity

export type SoundCategory = 'quran' | 'nature' | 'serenity';

export interface SoundItemMeta {
  id: string;
  name: string;
  category: SoundCategory;
  categoryName: string;
  icon: string;
  description: string;
  reciterOrType?: string;
  url?: string; // Direct HD audio streaming url
  isSynthetic?: boolean; // 432Hz harmonic generator
}

export const SERENITY_SOUNDS: SoundItemMeta[] = [
  // ==========================================
  // القسم الأول: تلاوات قرآنية خاشعة وهادئة جداً للسكينة
  // ==========================================
  {
    id: 'quran_rahman',
    name: 'سورة الرحمن (ترتيل هادئ)',
    category: 'quran',
    categoryName: 'تلاوات قرآنية خاشعة',
    icon: '📖',
    reciterOrType: 'الشيخ مشاري راشد العفاسي',
    description: 'ترتيل شجي يبعث على استشعار نعم الله وطمأنينة القلب',
    url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/055.mp3',
  },
  {
    id: 'quran_mulk',
    name: 'سورة الملك (خشوع وسكينة)',
    category: 'quran',
    categoryName: 'تلاوات قرآنية خاشعة',
    icon: '✨',
    reciterOrType: 'الشيخ عبد الباسط عبد الصمد',
    description: 'تلاوة مهيبة ومريحة للنفس قبل النوم وللراحة العميقة',
    url: 'https://download.quranicaudio.com/quran/abdulbaset_mujawwad/067.mp3',
  },
  {
    id: 'quran_yaseen',
    name: 'سورة يس (قلب القرآن)',
    category: 'quran',
    categoryName: 'تلاوات قرآنية خاشعة',
    icon: '🌿',
    reciterOrType: 'الشيخ ماهر المعيقلي',
    description: 'قراءة خاشعة هادئة تشرح الصدر وتزيل الهموم',
    url: 'https://download.quranicaudio.com/quran/maher_256/036.mp3',
  },
  {
    id: 'quran_waqiah',
    name: 'سورة الواقعة (سكينة الرزق واليقين)',
    category: 'quran',
    categoryName: 'تلاوات قرآنية خاشعة',
    icon: '🕊️',
    reciterOrType: 'الشيخ ياسر الدوسري',
    description: 'ترتيل مؤثر يورث القلب راحة ويقيناً عظيماً بالله',
    url: 'https://download.quranicaudio.com/quran/yasser_ad-dussary/056.mp3',
  },
  {
    id: 'quran_fatiha',
    name: 'فاتحة الكتاب (أم القرآن)',
    category: 'quran',
    categoryName: 'تلاوات قرآنية خاشعة',
    icon: '🤍',
    reciterOrType: 'الشيخ مشاري راشد العفاسي',
    description: 'السبع المثاني والشفاء التام ترتيل هادئ مكرر',
    url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3',
  },

  // ==========================================
  // القسم الثاني: أصوات طبيعية حقيقية مسجلة MP3 (أوفلاين بدون نت)
  // ==========================================
  {
    id: 'nature_light_rain',
    name: 'قطرات المطر العذبة',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '💧',
    reciterOrType: 'تسجيل مطر طبيعي نقي',
    description: 'تساقط قطرات المطر اللطيفة لراحة البال والتركيز العميق',
    url: '/sounds/rain.mp3',
  },
  {
    id: 'nature_thunder_rain',
    name: 'مطر حقيقي ورعد بعيد',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🌧️',
    reciterOrType: 'أجواء ماطرة هادئة',
    description: 'صوت هطول المطر الصيفي الحقيقي مع دوي رعد بعيد وهادئ',
    url: '/sounds/thunder.mp3',
  },
  {
    id: 'nature_ocean_waves',
    name: 'أمواج البحر الحقيقية',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🌊',
    reciterOrType: 'شاطئ هادئ',
    description: 'إيقاع تلاطم أمواج البحر الطبيعي يمنح صفاءً ذهنياً عميقاً',
    url: '/sounds/waves.mp3',
  },
  {
    id: 'nature_flowing_stream',
    name: 'خرير الماء والجدول العذب',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🏞️',
    reciterOrType: 'جدول ماء جبلي',
    description: 'صوت تدفق مياه رقراقة يبعث على الانشراح والسلام النفسي',
    url: '/sounds/river.mp3',
  },
  {
    id: 'nature_summer_birds',
    name: 'سكينة الغابة وطيور الفجر',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🐦',
    reciterOrType: 'طبيعة فجرية',
    description: 'أجواء صيفية صافية في بستان مع تغريد طيور هادئ',
    url: '/sounds/forest.mp3',
  },
  {
    id: 'nature_gentle_breeze',
    name: 'نسيم الرياح العليل',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🍃',
    reciterOrType: 'هواء هادئ',
    description: 'حفيف نسيم لطيف بين الأشجار يروّح عن النفس ويصفي الأفكار',
    url: '/sounds/wind.mp3',
  },
  {
    id: 'nature_bonfire',
    name: 'دفء جمرات النار الهادئة',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🔥',
    reciterOrType: 'حطب طبيعي هادئ',
    description: 'خشخشة نار هادئة في الهواء الطلق تمنح شعوراً بالأمان والسكينة',
    url: '/sounds/campfire.mp3',
  },
  {
    id: 'nature_night',
    name: 'سكون الليل وهدوء الطبيعة',
    category: 'nature',
    categoryName: 'أصوات الطبيعة الحقيقية',
    icon: '🌙',
    reciterOrType: 'ليل هادئ',
    description: 'همس السكون والليل مع أصوات الطبيعة الخافتة لنوم هنيء',
    url: '/sounds/night.mp3',
  },

  // ==========================================
  // القسم الثالث: أصوات صمت وتأمل وسكينة عميقة 432Hz
  // ==========================================
  {
    id: 'serenity_432hz',
    name: 'نقاء وتأمل روحي (432Hz)',
    category: 'serenity',
    categoryName: 'سكينة وتأمل عميق',
    icon: '🧘',
    reciterOrType: 'تردد السكينة التوافقي 432Hz',
    description: 'رنين نقي متوافق مع الفطرة لتهدئة ضربات القلب وطرد التوتر',
    isSynthetic: true,
  },
];

class SerenityAudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private syntheticNodes: (AudioNode | number)[] = [];
  private syntheticGain: GainNode | null = null;
  private currentItem: SoundItemMeta | null = null;
  private isPlayingState: boolean = false;
  private volumeLevel: number = 0.5;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private timerMinutes: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (!this.audioElement && typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      this.audioElement.addEventListener('ended', () => {
        if (this.currentItem?.category === 'quran') {
          this.stop();
        }
      });
      this.audioElement.addEventListener('error', (e) => {
        console.warn('Audio element error:', e);
      });
    }
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public play(item: SoundItemMeta, volume: number = 0.5) {
    this.initAudioElement();
    this.stopSynthetic();

    this.currentItem = item;
    this.volumeLevel = volume;
    this.isPlayingState = true;

    if (item.isSynthetic) {
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.playSynthetic(item.id, volume);
    } else if (item.url && this.audioElement) {
      this.audioElement.pause();
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
      this.audioElement.loop = item.category !== 'quran';

      const targetUrl = item.url;
      const currentSrc = this.audioElement.src;
      const needsReload = !currentSrc || !currentSrc.endsWith(targetUrl);

      if (needsReload) {
        this.audioElement.src = targetUrl;
        this.audioElement.currentTime = 0;
        this.audioElement.load();
      }

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio playback was prevented or interrupted:', err);
        });
      }
    }

    if (this.timerMinutes > 0) {
      this.startTimer(this.timerMinutes);
    }
  }

  private async playSynthetic(id: string, volume: number) {
    this.initAudioContext();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {}
    }

    this.syntheticGain = this.audioCtx.createGain();
    this.syntheticGain.gain.setValueAtTime(volume * 0.35, this.audioCtx.currentTime);
    this.syntheticGain.connect(this.audioCtx.destination);

    if (id === 'serenity_432hz') {
      // 432Hz harmonic warm soothing chime chords
      const frequencies = [432, 216, 540, 864];
      frequencies.forEach((f) => {
        if (!this.audioCtx || !this.syntheticGain) return;
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.audioCtx.currentTime);
        g.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        osc.connect(g);
        g.connect(this.syntheticGain);
        osc.start();
        this.syntheticNodes.push(osc, g);
      });
    }
  }

  public setVolume(v: number) {
    this.volumeLevel = Math.max(0, Math.min(1, v));
    if (this.audioElement) {
      this.audioElement.volume = this.volumeLevel;
    }
    if (this.syntheticGain && this.audioCtx) {
      this.syntheticGain.gain.setValueAtTime(this.volumeLevel * 0.35, this.audioCtx.currentTime);
    }
  }

  public setTimer(minutes: number, onEnd?: () => void) {
    this.timerMinutes = minutes;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (minutes > 0 && this.isPlayingState) {
      this.timerId = setTimeout(() => {
        this.stop();
        this.timerMinutes = 0;
        onEnd?.();
      }, minutes * 60 * 1000);
    }
  }

  private startTimer(minutes: number) {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      this.stop();
      this.timerMinutes = 0;
    }, minutes * 60 * 1000);
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.stopSynthetic();
    this.isPlayingState = false;
    this.currentItem = null;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private stopSynthetic() {
    this.syntheticNodes.forEach((node) => {
      if (typeof node === 'number') {
        clearInterval(node);
      } else if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
        try {
          (node as AudioScheduledSourceNode).stop();
        } catch {}
      } else if ('disconnect' in node) {
        try {
          node.disconnect();
        } catch {}
      }
    });
    this.syntheticNodes = [];
    if (this.syntheticGain) {
      try {
        this.syntheticGain.disconnect();
      } catch {}
      this.syntheticGain = null;
    }
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getCurrentItem(): SoundItemMeta | null {
    return this.currentItem;
  }
}

export const serenityPlayer = new SerenityAudioPlayer();
