import Dexie, { type Table } from 'dexie';
import type { 
  UserPreferences, 
  AdhkarProgress, 
  TasbeehSession, 
  KhatmaPlan, 
  Bookmark,
  AppSettings,
  AdhkarCategoryItem,
  AdhkarEntity,
  ReligiousSource,
  TasbeehTotal,
  QuranEdition,
  QuranSurah,
  QuranAyah,
  ReadingPosition,
  KhatmaDailyTarget,
  SunnahItem,
  NavigatorEmotion,
  NavigatorContent,
  StoryTemplate,
  ReminderSetting,
  SavedContent,
  AppMetadata
} from '../types';

export class MaladhDB extends Dexie {
  // User Data Tables
  user_preferences!: Table<UserPreferences, string>;
  app_settings!: Table<AppSettings, string>;
  adhkar_progress!: Table<AdhkarProgress, string>;
  tasbeeh_sessions!: Table<TasbeehSession, number>;
  tasbeeh_totals!: Table<TasbeehTotal, string>;
  bookmarks!: Table<Bookmark, string>;
  reading_positions!: Table<ReadingPosition, string>;
  khatma_plans!: Table<KhatmaPlan, string>;
  khatma_daily_targets!: Table<KhatmaDailyTarget, string>;
  reminder_settings!: Table<ReminderSetting, string>;
  saved_content!: Table<SavedContent, string>;
  app_metadata!: Table<AppMetadata, string>;

  // Static / Catalog Tables
  adhkar_categories!: Table<AdhkarCategoryItem, string>;
  adhkar!: Table<AdhkarEntity, string>;
  religious_sources!: Table<ReligiousSource, string>;
  quran_editions!: Table<QuranEdition, string>;
  quran_surahs!: Table<QuranSurah, number>;
  quran_ayahs!: Table<QuranAyah, string>;
  sunnah_content!: Table<SunnahItem, string>;
  navigator_emotions!: Table<NavigatorEmotion, string>;
  navigator_content!: Table<NavigatorContent, string>;
  story_templates!: Table<StoryTemplate, string>;

  constructor() {
    super('MaladhDatabase');

    // Version 1 Schema (Backwards compatibility)
    this.version(1).stores({
      user_preferences: 'id',
      adhkar_progress: 'category, date',
      tasbeeh_sessions: '++id, dhikrText',
      khatma_plans: 'id, status',
      bookmarks: 'id, timestamp'
    });

    // Version 2 Schema (Blueprint Specification v1.1 - 21 Tables)
    this.version(2).stores({
      user_preferences: 'id',
      app_settings: 'id',
      adhkar_progress: 'id, category, date, category_id, dhikr_id',
      tasbeeh_sessions: '++id, dhikrText, dhikr_id, status',
      tasbeeh_totals: 'id, dhikr_id',
      bookmarks: 'id, timestamp, pageNumber',
      reading_positions: 'id, edition_id, page_number',
      khatma_plans: 'id, status',
      khatma_daily_targets: 'id, plan_id, date, status',
      reminder_settings: 'id, type, enabled',
      saved_content: 'id, content_type, content_id',
      app_metadata: 'key',

      // Catalogs
      adhkar_categories: 'id, display_order, is_active',
      adhkar: 'id, category_id, display_order, source_id, review_status',
      religious_sources: 'id, source_type, review_status',
      quran_editions: 'id, review_status',
      quran_surahs: 'id, display_order',
      quran_ayahs: 'id, edition_id, surah_id, page_number',
      sunnah_content: 'id, display_order, review_status',
      navigator_emotions: 'id, display_order',
      navigator_content: 'id, emotion_id, review_status',
      story_templates: 'id, category, is_active'
    });
  }
}

export const db = new MaladhDB();

export const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'current',
  theme: 'system',
  vibrationEnabled: true,
  soundEnabled: false,
  fontSize: 'medium',
  notifications: {
    morningAdhkar: false,
    eveningAdhkar: false,
    quranDaily: false,
  },
  onboardingCompleted: false,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

// Initialize default preferences if not existing
export async function getOrCreatePreferences(): Promise<UserPreferences> {
  const existing = await db.user_preferences.get('current');
  if (existing) {
    return existing;
  }
  await db.user_preferences.put(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
}

// Full Export to JSON (Local Backup v1.1)
export async function exportBackupJSON(): Promise<string> {
  const prefs = await db.user_preferences.toArray();
  const adhkar = await db.adhkar_progress.toArray();
  const tasbeeh = await db.tasbeeh_sessions.toArray();
  const tasbeehTotals = await db.tasbeeh_totals.toArray();
  const khatma = await db.khatma_plans.toArray();
  const khatmaTargets = await db.khatma_daily_targets.toArray();
  const bookmarks = await db.bookmarks.toArray();
  const readingPositions = await db.reading_positions.toArray();
  const reminders = await db.reminder_settings.toArray();
  const saved = await db.saved_content.toArray();

  const backupData = {
    schema_version: 2,
    appName: 'MALADH',
    tagline: 'أَثَرٌ لِقَلْبِكَ.. وَذُخْرٌ لِي',
    exportedAt: new Date().toISOString(),
    data: {
      user_preferences: prefs,
      adhkar_progress: adhkar,
      tasbeeh_sessions: tasbeeh,
      tasbeeh_totals: tasbeehTotals,
      khatma_plans: khatma,
      khatma_daily_targets: khatmaTargets,
      bookmarks: bookmarks,
      reading_positions: readingPositions,
      reminder_settings: reminders,
      saved_content: saved,
    }
  };

  return JSON.stringify(backupData, null, 2);
}

// Full Restore from JSON (Local Restore v1.1)
export async function importBackupJSON(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.appName !== 'MALADH' || !parsed.data) {
      throw new Error('الملف غير متطابق مع نسق نسخ مَلَاذْ الاحتياطية');
    }

    await db.transaction('rw', [
      db.user_preferences, 
      db.adhkar_progress, 
      db.tasbeeh_sessions, 
      db.tasbeeh_totals,
      db.khatma_plans, 
      db.khatma_daily_targets,
      db.bookmarks,
      db.reading_positions,
      db.reminder_settings,
      db.saved_content
    ], async () => {
      if (parsed.data.user_preferences?.length) {
        await db.user_preferences.clear();
        await db.user_preferences.bulkPut(parsed.data.user_preferences);
      }
      if (parsed.data.adhkar_progress?.length) {
        await db.adhkar_progress.clear();
        await db.adhkar_progress.bulkPut(parsed.data.adhkar_progress);
      }
      if (parsed.data.tasbeeh_sessions?.length) {
        await db.tasbeeh_sessions.clear();
        await db.tasbeeh_sessions.bulkPut(parsed.data.tasbeeh_sessions);
      }
      if (parsed.data.tasbeeh_totals?.length) {
        await db.tasbeeh_totals.clear();
        await db.tasbeeh_totals.bulkPut(parsed.data.tasbeeh_totals);
      }
      if (parsed.data.khatma_plans?.length) {
        await db.khatma_plans.clear();
        await db.khatma_plans.bulkPut(parsed.data.khatma_plans);
      }
      if (parsed.data.khatma_daily_targets?.length) {
        await db.khatma_daily_targets.clear();
        await db.khatma_daily_targets.bulkPut(parsed.data.khatma_daily_targets);
      }
      if (parsed.data.bookmarks?.length) {
        await db.bookmarks.clear();
        await db.bookmarks.bulkPut(parsed.data.bookmarks);
      }
      if (parsed.data.reading_positions?.length) {
        await db.reading_positions.clear();
        await db.reading_positions.bulkPut(parsed.data.reading_positions);
      }
      if (parsed.data.reminder_settings?.length) {
        await db.reminder_settings.clear();
        await db.reminder_settings.bulkPut(parsed.data.reminder_settings);
      }
      if (parsed.data.saved_content?.length) {
        await db.saved_content.clear();
        await db.saved_content.bulkPut(parsed.data.saved_content);
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to import backup JSON:', error);
    return false;
  }
}
