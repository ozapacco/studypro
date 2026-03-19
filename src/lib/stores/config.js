import { writable, derived } from "svelte/store";
import { db } from "../db.js";

function createConfigStore() {
  const { subscribe, set, update } = writable(null);

  return {
    subscribe,

    async load() {
      let config = await db.config.get(1);

      if (!config) {
        config = {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.config.add(config);
      }

      set(config);
      return config;
    },

    async save(changes) {
      let payload;
      update((config) => {
        payload = {
          ...config,
          ...changes,
          updatedAt: new Date().toISOString(),
        };
        return payload;
      });
      await db.config.put(payload);
    },

    async updateFSRS(params) {
      let payload;
      update((config) => {
        payload = {
          ...config,
          fsrsParams: { ...config.fsrsParams, ...params },
          updatedAt: new Date().toISOString(),
        };
        return payload;
      });
      await db.config.put(payload);
    },

    async incrementStreak() {
      let payload;
      update((config) => {
        const streak = (config.gamification?.currentStreak || 0) + 1;
        payload = {
          ...config,
          gamification: {
            ...config.gamification,
            currentStreak: streak,
            longestStreak: Math.max(
              streak,
              config.gamification?.longestStreak || 0,
            ),
          },
          updatedAt: new Date().toISOString(),
        };
        return payload;
      });
      await db.config.put(payload);
    },

    async resetStreak() {
      let payload;
      update((config) => {
        payload = {
          ...config,
          gamification: {
            ...config.gamification,
            currentStreak: 0,
          },
          updatedAt: new Date().toISOString(),
        };
        return payload;
      });
      await db.config.put(payload);
    },

    async addXP(amount) {
      let payload;
      update((config) => {
        const totalXP = (config.gamification?.totalXP || 0) + amount;
        const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

        payload = {
          ...config,
          gamification: {
            ...config.gamification,
            totalXP,
            level,
          },
          updatedAt: new Date().toISOString(),
        };
        return payload;
      });
      await db.config.put(payload);
    },

    async setTutorMode(mode) {
      let payload;
      update((config) => {
        payload = {
          ...config,
          tutor: {
            ...config.tutor,
            mode,
          },
          updatedAt: new Date().toISOString(),
        };
        return payload;
      });
      await db.config.put(payload);
    },
  };
}

export const configStore = createConfigStore();

export const theme = derived(
  configStore,
  ($config) => $config?.preferences?.theme || "system",
);
export const fsrsParams = derived(
  configStore,
  ($config) => $config?.fsrsParams,
);
export const examDate = derived(
  configStore,
  ($config) => $config?.targetExam?.date || null,
);
export const daysUntilExam = derived(examDate, ($date) => {
  if (!$date) return null;
  const exam = new Date($date).getTime();
  const now = new Date().getTime();
  return Math.ceil((exam - now) / 86400000);
});
