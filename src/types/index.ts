export type ThemeMode = 'light' | 'dark' | 'system';

// ==========================================
// 1. User & Application Settings
// ==========================================
export interface UserPreferences {
  id: 'current' | string;
  theme: ThemeMode;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | string;
  notifications: {
    morningAdhkar: boolean;
    eveningAdhkar: boolean;
    quranDaily: boolean;
  };
  onboardingCompleted: boolean;
  lastActiveDate: string;
}

export interface AppSettings {
  id: string; // 'current'
  theme: ThemeMode;
  interface_font_size: number;
  quran_font_size: number;
  reduced_motion: boolean;
  haptic_enabled: boolean;
  audio_enabled: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// 2. Religious Sources & Citations
// ==========================================
export interface ReligiousSource {
  id: string;
  source_type: 'Quran' | 'Hadith' | 'Book';
  source_name: string;
  reference: string;
  grading?: string;
  source_url?: string;
  review_status: 'approved' | 'pending' | 'draft';
}

// ==========================================
// 3. Adhkar Data Models
// ==========================================
export type AdhkarCategory = 'morning' | 'evening' | 'sleep' | 'wakeup' | 'post_prayer';

export interface AdhkarCategoryItem {
  id: string;
  title_ar: string;
  description_ar: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export interface AdhkarItem {
  id: string;
  category: AdhkarCategory;
  text: string;
  source: string;
  reward?: string;
  count: number;
  order: number;
}

export interface AdhkarEntity {
  id: string;
  category_id: string;
  text_ar: string;
  display_text: string;
  repetition_count: number;
  source_id: string;
  virtue_text?: string;
  display_order: number;
  review_status: string;
  content_version: number;
}

export interface AdhkarProgress {
  id?: string;
  category: AdhkarCategory;
  category_id?: string;
  dhikr_id?: string;
  session_date?: string;
  date: string; // YYYY-MM-DD
  completedItems: string[]; // item IDs
  itemCounts: Record<string, number>; // itemId -> remaining count
  isCompleted: boolean;
  current_count?: number;
  target_count?: number;
  completed?: boolean;
  updated_at?: string;
}

// ==========================================
// 4. Tasbeeh Data Models
// ==========================================
export interface TasbeehSession {
  id?: number;
  dhikrText: string;
  targetCount: number; // 33, 100, custom, or 0 (unlimited)
  currentCount: number;
  completedRounds?: number;
  cumulativeTotal: number;
  history: number[]; // for undo
  lastUpdated: string;
  status?: 'Active' | 'Completed' | 'Paused';
}

export interface TasbeehTotal {
  id: string;
  dhikr_id: string;
  cumulative_count: number;
  updated_at: string;
}

// ==========================================
// 5. Quran & Reading Models
// ==========================================
export interface QuranEdition {
  id: string;
  name_ar: string;
  script_type: string;
  page_count: number; // 604
  source_name: string;
  content_version: number;
  review_status: string;
}

export interface QuranSurah {
  id: number;
  name_ar: string;
  name_en?: string;
  ayah_count: number;
  revelation_type: 'Makki' | 'Madani';
  display_order: number;
}

export interface QuranAyah {
  id: string;
  edition_id: string;
  surah_id: number;
  ayah_number: number;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  hizb_number?: number;
  rub_number?: number;
}

export interface Bookmark {
  id: string;
  edition_id?: string;
  title: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  pageNumber: number;
  timestamp: string;
  saved_at?: string;
}

export interface ReadingPosition {
  id: string;
  edition_id: string;
  surah_id: number;
  ayah_number: number;
  page_number: number;
  updated_at: string;
}

// ==========================================
// 6. Khatma Journey Models
// ==========================================
export interface KhatmaPlan {
  id: string;
  title: string;
  edition_id?: string;
  targetDays: number;
  duration_days?: number;
  startDate: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  currentSurah: number;
  currentSurahName: string;
  currentAyah: number;
  currentPage: number;
  totalPages: number; // 604
  total_pages?: number;
  dailyTargetPages: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface KhatmaDailyTarget {
  id: string;
  plan_id: string;
  date: string;
  start_page: number;
  end_page: number;
  target_pages: number;
  completed_pages: number;
  status: 'Pending' | 'Partial' | 'Completed';
}

// ==========================================
// 7. Spiritual Navigator Models
// ==========================================
export type EmotionalMood = 
  | 'anxious' // قلق وتوتر
  | 'sad' // حزن وضيق
  | 'fear' // خوف وتشتت
  | 'guilt' // ذنب وتقصير
  | 'grateful'; // شكر ورضا

export interface NavigatorEmotion {
  id: string;
  title_ar: string;
  description_ar: string;
  icon: string;
  display_order: number;
}

export interface SpiritualContent {
  id: string;
  mood: EmotionalMood;
  ayah: {
    text: string;
    surahName: string;
    ayahNumber: number;
  };
  reflection: string;
  supplication: {
    text: string;
    source: string;
    grade?: string;
  };
  suggestedDhikr: {
    text: string;
    targetCount: number;
  };
}

export interface NavigatorContent {
  id: string;
  emotion_id: string;
  verse_id?: string;
  reflection_ar: string;
  dua_id?: string;
  dhikr_id?: string;
  review_status: string;
  content_version: number;
}

// ==========================================
// 8. Sunnah Item Models
// ==========================================
export interface SunnahItem {
  id: string;
  title: string;
  title_ar?: string;
  category?: string;
  hadithText: string;
  hadith_text?: string;
  explanation_ar?: string;
  source: string;
  source_id?: string;
  grade: string;
  authenticity_grade?: string;
  practicalSteps: string[];
  application_ar?: string;
  reflection: string;
  appliedDates: string[]; // list of dates user marked as applied
  review_status?: string;
  display_order?: number;
}

// ==========================================
// 9. Story Studio Templates
// ==========================================
export interface StoryTemplate {
  id: string;
  name: string;
  category: string;
  background_asset: string;
  width: number;
  height: number;
  layout_config: Record<string, unknown>;
  is_active: boolean;
}

// ==========================================
// 10. Reminders & Metadata
// ==========================================
export interface ReminderSetting {
  id: string;
  type: string;
  enabled: boolean;
  local_time: string;
  repeat_days: number[];
  updated_at: string;
}

export interface SavedContent {
  id: string;
  content_type: 'Dhikr' | 'Verse' | 'Sunnah';
  content_id: string;
  saved_at: string;
}

export interface AppMetadata {
  key: string;
  value: string | Record<string, unknown>;
  updated_at: string;
}
