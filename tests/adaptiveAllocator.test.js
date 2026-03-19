import { describe, it, expect } from "vitest";

describe("AdaptiveAllocator", async () => {
  const { AdaptiveAllocator } =
    await import("$lib/engines/adaptiveAllocator.js");
  const allocator = new AdaptiveAllocator();

  const criticalMastery = [
    { id: 1, name: "Penal", retention: 30, totalCards: 50 },
  ];
  const weakMastery = [{ id: 1, name: "Penal", retention: 55, totalCards: 50 }];
  const mediumMastery = [
    { id: 1, name: "Penal", retention: 70, totalCards: 50 },
  ];
  const strongMastery = [
    { id: 1, name: "Penal", retention: 90, totalCards: 50 },
  ];
  const mixedMastery = [
    { id: 1, name: "Penal", retention: 30, totalCards: 50 },
    { id: 2, name: "Admin", retention: 55, totalCards: 30 },
    { id: 3, name: "Contabeis", retention: 75, totalCards: 20 },
    { id: 4, name: "TI", retention: 92, totalCards: 40 },
  ];

  describe("allocate", () => {
    it("returns distribution and allocation when mastery is empty", async () => {
      const result = await allocator.allocate(60, []);

      expect(result).toHaveProperty("distribution");
      expect(result).toHaveProperty("allocation");
      expect(result.allocation).toHaveProperty("urgentReviews");
      expect(result.allocation).toHaveProperty("reviews");
      expect(result.allocation).toHaveProperty("newContent");
      expect(result.allocation).toHaveProperty("questions");
      expect(result.allocation).toHaveProperty("encoding");
    });

    it("allocates more time to critical subjects", async () => {
      const result = await allocator.allocate(60, criticalMastery);

      expect(result.summary.critical).toBe(1);
      expect(result.distribution[1]).toBeDefined();
      expect(result.distribution[1].priority).toBe("critical");
    });

    it("categorizes weak subjects correctly", async () => {
      const result = await allocator.allocate(60, weakMastery);

      expect(result.summary.weak).toBe(1);
      expect(result.distribution[1].priority).toBe("weak");
    });

    it("categorizes medium subjects correctly", async () => {
      const result = await allocator.allocate(60, mediumMastery);

      expect(result.summary.medium).toBe(1);
      expect(result.distribution[1].priority).toBe("medium");
    });

    it("categorizes strong subjects correctly", async () => {
      const result = await allocator.allocate(60, strongMastery);

      expect(result.summary.strong).toBe(1);
      expect(result.distribution[1].priority).toBe("strong");
    });

    it("handles mixed mastery levels", async () => {
      const result = await allocator.allocate(120, mixedMastery);

      expect(result.summary.critical).toBe(1);
      expect(result.summary.weak).toBe(1);
      expect(result.summary.medium).toBe(1);
      expect(result.summary.strong).toBe(1);
      expect(result.summary.total).toBe(4);
    });

    it("total allocation matches totalMinutes", async () => {
      const result = await allocator.allocate(60, mixedMastery);
      const totalAllocated = Object.values(result.allocation).reduce(
        (a, b) => a + b,
        0,
      );

      expect(totalAllocated).toBe(60);
    });

    it("includes encoding in allocation", async () => {
      const result = await allocator.allocate(60, mixedMastery);

      expect(result.allocation.encoding).toBeGreaterThan(0);
      expect(result.allocation.encoding).toBeLessThanOrEqual(15);
    });
  });

  describe("getStudyProfile", () => {
    it('returns "catchup" when there are critical subjects', () => {
      const profile = allocator.getStudyProfile(criticalMastery, [], [], []);
      expect(profile).toBe("catchup");
    });

    it('returns "building" when weak subjects dominate', () => {
      const profile = allocator.getStudyProfile([], weakMastery, [], []);
      expect(profile).toBe("building");
    });

    it('returns "maintenance" when strong subjects dominate', () => {
      const profile = allocator.getStudyProfile([], [], [], strongMastery);
      expect(profile).toBe("maintenance");
    });

    it('returns "balanced" otherwise', () => {
      const profile = allocator.getStudyProfile(
        [],
        weakMastery,
        [],
        strongMastery,
      );
      expect(profile).toBe("balanced");
    });
  });

  describe("calculateTimeAllocation", () => {
    it("catchup profile prioritizes reviews and urgentReviews", () => {
      const alloc = allocator.calculateTimeAllocation(100, "catchup");

      expect(alloc.reviews).toBeGreaterThan(alloc.newContent);
      expect(alloc.urgentReviews).toBeGreaterThan(0);
    });

    it("maintenance profile prioritizes questions", () => {
      const alloc = allocator.calculateTimeAllocation(100, "maintenance");

      expect(alloc.questions).toBeGreaterThan(alloc.newContent);
    });

    it("building profile balances reviews and newContent", () => {
      const alloc = allocator.calculateTimeAllocation(100, "building");

      expect(alloc.reviews).toBeGreaterThan(0);
      expect(alloc.newContent).toBeGreaterThan(0);
    });

    it("balanced profile distributes evenly", () => {
      const alloc = allocator.calculateTimeAllocation(100, "balanced");

      expect(alloc.reviews).toBeGreaterThan(0);
      expect(alloc.newContent).toBeGreaterThan(0);
      expect(alloc.questions).toBeGreaterThan(0);
    });
  });

  describe("getRecommendedFocus", () => {
    it("returns critical priority when critical subjects exist", async () => {
      const result = await allocator.getRecommendedFocus(
        criticalMastery.map((s) => ({
          ...s,
          critical: s.retention < 40,
          weak: s.retention >= 40 && s.retention < 85,
        })),
      );

      expect(result.priority).toBe("critical");
      expect(result.subjects).toHaveLength(1);
    });

    it("returns weak priority when no critical but weak exist", async () => {
      const result = await allocator.getRecommendedFocus(
        weakMastery.map((s) => ({
          ...s,
          critical: false,
          weak: true,
        })),
      );

      expect(result.priority).toBe("weak");
    });

    it("returns strong when all subjects are strong", async () => {
      const result = await allocator.getRecommendedFocus(
        strongMastery.map((s) => ({
          ...s,
          critical: false,
          weak: false,
        })),
      );

      expect(result.priority).toBe("strong");
      expect(result.subjects).toHaveLength(0);
    });
  });
});
