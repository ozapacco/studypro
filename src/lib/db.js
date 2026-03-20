import Dexie from "dexie";
import { seedSyllabus } from "./data/syllabus.js";

/**
 * @typedef {import('dexie').Table} Table
 *
 * @typedef {Object} StudyDatabase
 * @property {Table} config
 * @property {Table} subjects
 * @property {Table} topics
 * @property {Table} cards
 * @property {Table} reviewLogs
 * @property {Table} sessions
 * @property {Table} lessons
 * @property {Table} dailyStats
 * @property {Table} exams
 * @property {Table} backups
 * @property {Table} notes
 */

/** @type {Dexie & StudyDatabase} */
export const db = /** @type {any} */ (new Dexie("StudySystemDB"));

let initPromise = null;

db.version(2).stores({
  config: "++id",
  subjects: "++id, name, weight, &order",
  topics: "++id, subjectId, name, &[subjectId+order]",
  cards:
    "++id, topicId, subjectId, type, state, due, [state+due], [subjectId+state], buried, suspended",
  reviewLogs: "++id, cardId, timestamp, [cardId+timestamp]",
  sessions: "++id, date, status, [date+status]",
  lessons: "++id, topicId, &[topicId+order], completed",
  dailyStats: "++id, &date",
  exams: "++id, date",
  backups: "++id, timestamp",
});

db.version(3).stores({
  config: "++id",
  subjects: "++id, name, weight, &order",
  topics: "++id, subjectId, name, &[subjectId+order]",
  cards:
    "++id, topicId, subjectId, type, state, due, [state+due], [subjectId+state], buried, suspended",
  reviewLogs: "++id, cardId, timestamp, [cardId+timestamp]",
  sessions: "++id, date, status, [date+status]",
  lessons: "++id, topicId, &[topicId+order], completed",
  dailyStats: "++id, &date",
  exams: "++id, date",
  backups: "++id, timestamp",
  notes: "++id, topicId, type, createdAt",
});

db.version(4)
  .stores({
    config: "++id",
    subjects: "++id, name, weight, &order",
    topics:
      "++id, subjectId, name, importance, difficulty, &[subjectId+order], mindMapPuml",
    cards:
      "++id, topicId, subjectId, type, state, due, [state+due], [subjectId+state], buried, suspended",
    reviewLogs: "++id, cardId, timestamp, [cardId+timestamp]",
    sessions: "++id, date, status, [date+status]",
    lessons: "++id, topicId, &[topicId+order], completed",
    dailyStats: "++id, &date",
    exams: "++id, date",
    backups: "++id, timestamp",
    notes: "++id, topicId, type, createdAt",
  })
  .upgrade(() =>
    db.topics.toCollection().modify((t) => {
      if (t.mindMapPuml === undefined) t.mindMapPuml = null;
    }),
  );

db.cards.hook("creating", (_key, obj) => {
  const now = new Date().toISOString();
  /** @type {any} */ (obj).createdAt =
    /** @type {any} */ (obj).createdAt || now;
  /** @type {any} */ (obj).updatedAt = now;
});

db.cards.hook("updating", (changes) => {
  /** @type {any} */ (changes).updatedAt = new Date().toISOString();
});

export async function initializeDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const config = await db.config.get(1);
      if (!config) {
        await db.config.add({
          id: 1,
          userName: "",
          targetExam: {
            name: "",
            date: null,
            institution: "",
            positions: 0,
          },
          schedule: {
            weeklyHours: 20,
            dailyDistribution: {
              monday: 3,
              tuesday: 3,
              wednesday: 3,
              thursday: 3,
              friday: 3,
              saturday: 3,
              sunday: 2,
            },
            preferredStartTime: "06:00",
            breakDuration: 10,
            sessionBlockMinutes: 50,
          },
          fsrsParams: {
            w: [
              0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94,
              2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
            ],
            requestRetention: 0.85,
            maximumInterval: 365,
            enableFuzz: true,
          },
          preferences: {
            newCardsPerDay: 20,
            maxReviewsPerDay: 200,
            interleaveSubjects: true,
            showAnswerTime: true,
            enableSound: true,
            theme: "system",
          },
          gamification: {
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            level: 1,
          },
          tutor: {
            mode: "active",
            strictSubjectId: null,
            lastMission: null,
            lastRecalcAt: null,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (!config.tutor) {
        await db.config.update(1, {
          tutor: {
            mode: "active",
            strictSubjectId: null,
            lastMission: null,
            lastRecalcAt: null,
          },
        });
      }

      await seedSyllabus();
      return true;
    } catch (e) {
      initPromise = null;
      throw e;
    }
  })();

  return initPromise;
}

export async function exportDatabase() {
  const tables = [
    "config",
    "subjects",
    "topics",
    "cards",
    "reviewLogs",
    "sessions",
    "lessons",
    "dailyStats",
    "exams",
  ];
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {},
  };

  for (const tableName of tables) {
    data.tables[tableName] = await db[tableName].toArray();
  }

  await db.backups.add({
    timestamp: new Date().toISOString(),
    type: "export",
    destination: "file",
    status: "success",
  });

  return data;
}

export async function importDatabase(data) {
  if (!data?.tables) {
    throw new Error("Invalid backup payload");
  }

  await db.delete();
  await db.open();

  for (const [tableName, records] of Object.entries(data.tables)) {
    if (!db[tableName] || !Array.isArray(records) || records.length === 0)
      continue;
    await db[tableName].bulkAdd(records);
  }

  return true;
}

export async function cleanupOldData(daysToKeep = 365, chunkSize = 1000) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffISO = cutoff.toISOString();

  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    const ids = await db.reviewLogs
      .where("timestamp")
      .below(cutoffISO)
      .limit(chunkSize)
      .primaryKeys();
    if (ids.length === 0) {
      hasMore = false;
      break;
    }
    await db.reviewLogs.bulkDelete(ids);
    totalDeleted += ids.length;
    // Allow UI to breathe
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return { deletedLogs: totalDeleted };
}
