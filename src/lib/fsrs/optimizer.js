export class FSRSOptimizer {
  static calculateActualRetention(reviewLogs) {
    if (!Array.isArray(reviewLogs) || reviewLogs.length < 50) return null;

    const reviewOnly = reviewLogs.filter((log) => log.stateBefore === 'review');
    if (reviewOnly.length < 30) return null;

    const remembered = reviewOnly.filter((log) => log.rating >= 2).length;
    return remembered / reviewOnly.length;
  }

  static analyzeBySubject(reviewLogs, cards) {
    const bySubject = {};

    for (const log of reviewLogs) {
      const card = cards.find((c) => c.id === log.cardId);
      if (!card) continue;

      const subjectId = card.subjectId;
      if (!bySubject[subjectId]) bySubject[subjectId] = { total: 0, remembered: 0, avgTime: 0 };

      bySubject[subjectId].total += 1;
      if (log.rating >= 2) bySubject[subjectId].remembered += 1;
      bySubject[subjectId].avgTime += log.responseTime || 0;
    }

    for (const subjectId of Object.keys(bySubject)) {
      const data = bySubject[subjectId];
      data.retention = data.total > 0 ? data.remembered / data.total : 0;
      data.avgTime = data.total > 0 ? data.avgTime / data.total : 0;
    }

    return bySubject;
  }

  static suggestRetention(reviewLogs, currentRetention = 0.85) {
    const actual = this.calculateActualRetention(reviewLogs);

    if (actual === null) {
      return {
        suggested: currentRetention,
        reason: 'Insufficient data for calibration'
      };
    }

    if (actual < currentRetention - 0.1) {
      return {
        suggested: Math.max(0.8, currentRetention - 0.05),
        reason: `Actual retention ${(actual * 100).toFixed(1)}% is below target`
      };
    }

    if (actual > currentRetention + 0.05) {
      return {
        suggested: Math.min(0.95, currentRetention + 0.03),
        reason: `Actual retention ${(actual * 100).toFixed(1)}% is above target`
      };
    }

    return {
      suggested: currentRetention,
      reason: `Actual retention ${(actual * 100).toFixed(1)}% is close to target`
    };
  }

  static detectEaseHell(cards) {
    const reviewCards = cards.filter((c) => c.state === 'review');
    if (reviewCards.length < 20) return null;

    const avgDifficulty = reviewCards.reduce((sum, c) => sum + c.difficulty, 0) / reviewCards.length;
    const highDifficultyCount = reviewCards.filter((c) => c.difficulty > 7).length;
    const percentage = highDifficultyCount / reviewCards.length;

    if (percentage > 0.3 || avgDifficulty > 6.5) {
      return {
        detected: true,
        avgDifficulty,
        highDifficultyPercentage: percentage,
        suggestion: 'Many cards are too difficult. Consider refactoring or resetting hard cards.'
      };
    }

    return { detected: false };
  }
}
