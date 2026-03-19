export class Interleaver {
  interleaveCards(cards, options = {}) {
    const { maxConsecutive = 3 } = options;

    if (cards.length <= 1) return cards;

    const bySubject = this.groupBy(cards, 'subjectId');
    const subjects = Object.keys(bySubject);
    if (subjects.length <= 1) return cards;

    const interleaved = [];
    let lastSubjectId = null;
    let consecutiveCount = 0;

    while (this.hasRemaining(bySubject)) {
      const nextSubject = this.selectNextSubject(bySubject, lastSubjectId, consecutiveCount >= maxConsecutive);
      if (!nextSubject) break;

      const card = bySubject[nextSubject].shift();
      interleaved.push(card);

      if (nextSubject === lastSubjectId) {
        consecutiveCount += 1;
      } else {
        lastSubjectId = nextSubject;
        consecutiveCount = 1;
      }
    }

    return interleaved;
  }

  selectNextSubject(bySubject, lastSubjectId, forceSwitch) {
    const available = Object.entries(bySubject)
      .filter(([, cards]) => cards.length > 0)
      .map(([id]) => id);

    if (available.length === 0) return null;
    if (available.length === 1) return available[0];

    let candidates = available;
    if (forceSwitch && lastSubjectId) {
      candidates = available.filter((id) => id !== lastSubjectId);
      if (candidates.length === 0) candidates = available;
    }

    if (lastSubjectId && candidates.includes(lastSubjectId) && candidates.length > 1 && Math.random() < 0.8) {
      const others = candidates.filter((id) => id !== lastSubjectId);
      return others[Math.floor(Math.random() * others.length)];
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  createStudyCycle(config) {
    const { subjects, totalMinutes, blockDuration = 25 } = config;
    const totalWeight = subjects.reduce((sum, subject) => sum + subject.weight, 0);

    let remainingMinutes = totalMinutes;
    let position = 0;
    const blocks = [];

    for (const subject of subjects) {
      const proportion = subject.weight / totalWeight;
      const subjectMinutes = Math.round(totalMinutes * proportion);
      const blockCount = Math.max(1, Math.round(subjectMinutes / blockDuration));

      for (let i = 0; i < blockCount && remainingMinutes > 0; i += 1) {
        const duration = Math.min(blockDuration, remainingMinutes);
        blocks.push({
          subjectId: subject.id,
          subjectName: subject.name,
          duration,
          position: position++,
          type: 'study'
        });
        remainingMinutes -= duration;
      }
    }

    return this.shuffleBlocks(blocks);
  }

  shuffleBlocks(blocks) {
    if (blocks.length <= 2) return blocks;

    const grouped = this.groupBy(blocks, 'subjectId');
    const result = [];

    while (this.hasRemaining(grouped)) {
      const keys = Object.keys(grouped).filter((k) => grouped[k].length > 0);
      for (const key of keys) {
        result.push(grouped[key].shift());
      }
    }

    return result;
  }

  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const bucket = item[key];
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(item);
      return acc;
    }, {});
  }

  hasRemaining(grouped) {
    return Object.values(grouped).some((arr) => arr.length > 0);
  }
}

export const interleaver = new Interleaver();
