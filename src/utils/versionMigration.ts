/**
 * Versioned Data Migration & Clean Reset Utility
 *
 * Ensures all previous hardcoded seed data, outdated mock stores,
 * and old cached versions are safely wiped exactly once upon upgrading
 * to this clean production version, while keeping all user data clean going forward.
 */

export const CURRENT_DATA_VERSION = "es_planner_v5_clean_zero_state";
const VERSION_KEY = "es_data_version";

export function ensureCleanDataVersion(): void {
  try {
    const existingVersion = localStorage.getItem(VERSION_KEY);
    if (existingVersion === CURRENT_DATA_VERSION) {
      // Already running on clean version; never wipe again.
      return;
    }

    console.info(`[ES Planner] Upgrading data store to ${CURRENT_DATA_VERSION}. Purging old sample data...`);

    // 1. Clear all localStorage keys holding old demo data
    const keysToRemove = [
      "es_courses",
      "es_study_sessions",
      "es_exams",
      "es_notes",
      "es_learning_notes",
      "es_user_profile",
      "es_weekly_goal",
      "es_day_tasks",
      "es_day_planner_prefs",
      "es_exam_revision_plans",
      "es_practice_questions",
      "es_practice_resources",
      "es_practice_settings",
      "es_practice_streak",
      "es_practice_results",
      "es_practice_attempts_history",
      "es_practice_sync_queue",
      "es_ai_sessions",
      "es_ai_messages",
      "es_active_tab",
      "es_has_seen_tutorial"
    ];

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignore
      }
    });

    // Clear any timer session states
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("es_timer_")) {
          localStorage.removeItem(k);
        }
      });
    } catch {}

    // 2. Clear old IndexedDB databases if any exist
    if (typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB.databases) {
      window.indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            try {
              window.indexedDB.deleteDatabase(db.name);
            } catch {
              // Ignore
            }
          }
        });
      }).catch(() => {});
    }

    // 3. Clear Service Worker cache stores left from previous builds
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName).catch(() => {});
        });
      }).catch(() => {});
    }

    // 4. Record new version and keep license active
    localStorage.setItem(VERSION_KEY, CURRENT_DATA_VERSION);
    localStorage.setItem("es_app_activated", "true");
  } catch (err) {
    console.warn("[ES Planner] Version migration check encountered an error:", err);
  }
}
