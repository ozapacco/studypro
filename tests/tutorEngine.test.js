import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSubjects = [
  { id: 1, name: "Penal", color: "#ef4444", weight: 0.3 },
  { id: 2, name: "Admin", color: "#22c55e", weight: 0.2 },
  { id: 3, name: "Contabeis", color: "#6366f1", weight: 0.15 },
];

const mockCards = [
  {
    id: 1,
    subjectId: 1,
    topicId: 1,
    state: "review",
    stability: 25,
    lastReview: new Date(Date.now() - 86400000).toISOString(),
    stats: { totalReviews: 5, correctCount: 4 },
  },
  {
    id: 2,
    subjectId: 1,
    topicId: 1,
    state: "review",
    stability: 5,
    lastReview: new Date(Date.now() - 86400000).toISOString(),
    stats: { totalReviews: 2, correctCount: 1 },
  },
  {
    id: 3,
    subjectId: 2,
    topicId: 2,
    state: "new",
    stats: { totalReviews: 0, correctCount: 0 },
  },
  {
    id: 4,
    subjectId: 2,
    topicId: 2,
    state: "review",
    stability: 30,
    lastReview: new Date(Date.now() - 86400000).toISOString(),
    stats: { totalReviews: 10, correctCount: 9 },
  },
  {
    id: 5,
    subjectId: 3,
    topicId: 3,
    state: "review",
    stability: 2,
    lastReview: new Date(Date.now() - 86400000).toISOString(),
    stats: { totalReviews: 1, correctCount: 0 },
  },
];

const mockTopics = [
  { id: 1, name: "Crimes", subjectId: 1 },
  { id: 2, name: "Agentes", subjectId: 2 },
  { id: 3, name: "Balanco", subjectId: 3 },
];

const mockDb = /** @type {any} */ ({
  subjects: {
    toArray: vi.fn(() => Promise.resolve(mockSubjects)),
    get: vi.fn((id) => Promise.resolve(mockSubjects.find((s) => s.id === id))),
  },
  cards: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
    })),
    toArray: vi.fn(() => Promise.resolve(mockCards)),
  },
  topics: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
        first: vi.fn(() => Promise.resolve(null)),
      })),
    })),
  },
  config: {
    get: vi.fn(() =>
      Promise.resolve({
        tutor: { mode: "active" },
        targetExam: { date: null },
      }),
    ),
    update: vi.fn(() => Promise.resolve()),
  },
});

vi.mock("$lib/db.js", () => ({
  db: mockDb,
  initializeDatabase: vi.fn(() => Promise.resolve(true)),
}));

describe("TutorEngine", async () => {
  const { TutorEngine, TUTOR_MODE, PROFICIENCY_THRESHOLD } =
    await import("$lib/engines/tutorEngine.js");
  const tutor = new TutorEngine();

  describe("PROFICIENCY_THRESHOLD", () => {
    it("defines correct threshold values", () => {
      expect(PROFICIENCY_THRESHOLD.STRONG).toBe(0.85);
      expect(PROFICIENCY_THRESHOLD.WEAK).toBe(0.6);
      expect(PROFICIENCY_THRESHOLD.CRITICAL).toBe(0.4);
    });
  });

  describe("TUTOR_MODE", () => {
    it("has all three modes", () => {
      expect(TUTOR_MODE.PASSIVE).toBe("passive");
      expect(TUTOR_MODE.ACTIVE).toBe("active");
      expect(TUTOR_MODE.STRICT).toBe("strict");
    });
  });

  describe("getMasteryLabel", () => {
    it('returns "forte" for retention >= 85', () => {
      expect(tutor.getMasteryLabel(85)).toBe("forte");
      expect(tutor.getMasteryLabel(90)).toBe("forte");
    });

    it('returns "medio" for retention 60-84', () => {
      expect(tutor.getMasteryLabel(60)).toBe("medio");
      expect(tutor.getMasteryLabel(70)).toBe("medio");
      expect(tutor.getMasteryLabel(84)).toBe("medio");
    });

    it('returns "fraco" for retention 40-59', () => {
      expect(tutor.getMasteryLabel(40)).toBe("fraco");
      expect(tutor.getMasteryLabel(50)).toBe("fraco");
      expect(tutor.getMasteryLabel(59)).toBe("fraco");
    });

    it('returns "critico" for retention < 40', () => {
      expect(tutor.getMasteryLabel(39)).toBe("critico");
      expect(tutor.getMasteryLabel(0)).toBe("critico");
    });
  });

  describe("calculateSubjectMastery", () => {
    beforeEach(() => {
      mockDb.cards.where = vi.fn(() => ({
        equals: (val) => ({
          toArray: () =>
            Promise.resolve(mockCards.filter((c) => c.subjectId === val)),
        }),
      }));
    });

    it("calculates mastery for all subjects", async () => {
      const result = await tutor.calculateSubjectMastery(mockSubjects);

      expect(result).toHaveLength(mockSubjects.length);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("retention");
      expect(result[0]).toHaveProperty("accuracy");
      expect(result[0]).toHaveProperty("coverage");
      expect(result[0]).toHaveProperty("domainScore");
      expect(result[0]).toHaveProperty("weak");
      expect(result[0]).toHaveProperty("critical");
    });

    it("marks weak subjects correctly", async () => {
      const result = await tutor.calculateSubjectMastery(mockSubjects);
      const penal = result.find((s) => s.id === 1);

      expect(penal).toHaveProperty("weak", true);
      expect(penal).toHaveProperty("critical", false);
    });

    it("marks strong subjects correctly", async () => {
      const result = await tutor.calculateSubjectMastery(mockSubjects);
      const admin = result.find((s) => s.id === 2);

      expect(admin).toHaveProperty("weak", false);
    });

    it("marks critical subjects correctly", async () => {
      const result = await tutor.calculateSubjectMastery(mockSubjects);
      const contabeis = result.find((s) => s.id === 3);

      expect(contabeis).toHaveProperty("critical", true);
    });

    it("domainScore is between 0 and 100", async () => {
      const result = await tutor.calculateSubjectMastery(mockSubjects);
      for (const subject of result) {
        expect(subject.domainScore).toBeGreaterThanOrEqual(0);
        expect(subject.domainScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("actionToBlockType", () => {
    it("maps action types correctly", () => {
      expect(tutor.actionToBlockType("urgent")).toBe("urgent_review");
      expect(tutor.actionToBlockType("review")).toBe("review");
      expect(tutor.actionToBlockType("new")).toBe("new_content");
      expect(tutor.actionToBlockType("unknown")).toBe("review");
    });
  });

  describe("estimateTime", () => {
    it("estimates time based on card types", () => {
      const topic = { id: 1, name: "Teste" };
      const urgent = [{ id: 1, state: "learning" }];
      const reviews = [{ id: 2, state: "review" }];
      const newCards = [{ id: 3, state: "new" }];

      const time = tutor.estimateTime(topic, [...urgent, ...reviews], newCards);

      expect(time).toBeGreaterThanOrEqual(10);
      expect(time).toBeLessThanOrEqual(60);
    });

    it("caps at 60 minutes", () => {
      const topic = { id: 1, name: "Teste" };
      const many = Array(50).fill({ id: 1, state: "learning" });
      const manyNew = Array(20).fill({ id: 2, state: "new" });

      const time = tutor.estimateTime(topic, many, manyNew);
      expect(time).toBeLessThanOrEqual(60);
    });
  });
});
