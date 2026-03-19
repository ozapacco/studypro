import { db } from "../db.js";
import { tutorEngine, PROFICIENCY_THRESHOLD } from "./tutorEngine.js";

export class AdaptiveAllocator {
  async allocate(totalMinutes, mastery, config = {}) {
    const {
      minTimePerSubject = 10,
      strongThreshold = PROFICIENCY_THRESHOLD.STRONG,
      weakThreshold = PROFICIENCY_THRESHOLD.WEAK,
    } = config;

    const critical = mastery.filter(
      (s) => s.retention < PROFICIENCY_THRESHOLD.CRITICAL * 100,
    );
    const weak = mastery.filter(
      (s) =>
        s.retention >= PROFICIENCY_THRESHOLD.CRITICAL * 100 &&
        s.retention < weakThreshold * 100,
    );
    const medium = mastery.filter(
      (s) =>
        s.retention >= weakThreshold * 100 &&
        s.retention < strongThreshold * 100,
    );
    const strong = mastery.filter((s) => s.retention >= strongThreshold * 100);

    if (mastery.length === 0) {
      return {
        distribution: {},
        allocation: this.defaultAllocation(totalMinutes),
      };
    }

    const distribution = {};
    const allocation = {
      urgentReviews: 0,
      newContent: 0,
      reviews: 0,
      questions: 0,
      encoding: 0,
    };

    let remaining = totalMinutes;

    const encoding = Math.min(15, Math.floor(remaining * 0.08));
    allocation.encoding = encoding;
    remaining -= encoding;

    if (critical.length > 0) {
      const perSubject = Math.max(
        minTimePerSubject,
        Math.floor((totalMinutes * 0.5) / critical.length),
      );
      critical.forEach((s) => {
        distribution[s.id] = {
          minutes: perSubject,
          priority: "critical",
          retention: s.retention,
          reason: `Dominio critico (${s.retention}%) — urgencia maxima`,
        };
      });
      remaining -= critical.length * perSubject;
    }

    if (weak.length > 0) {
      const perSubject = Math.max(
        minTimePerSubject,
        Math.floor((totalMinutes * 0.3) / weak.length),
      );
      weak.forEach((s) => {
        distribution[s.id] = {
          minutes: perSubject,
          priority: "weak",
          retention: s.retention,
          reason: `Dominio fraco (${s.retention}%) — precisa de foco`,
        };
      });
      remaining -= weak.length * perSubject;
    }

    if (medium.length > 0) {
      const perSubject = Math.max(
        minTimePerSubject,
        Math.floor((totalMinutes * 0.15) / medium.length),
      );
      medium.forEach((s) => {
        distribution[s.id] = {
          minutes: perSubject,
          priority: "medium",
          retention: s.retention,
          reason: `Em progresso (${s.retention}%) — manutencao leve`,
        };
      });
      remaining -= medium.length * perSubject;
    }

    if (strong.length > 0) {
      const perSubject = Math.max(
        minTimePerSubject / 2,
        Math.floor((totalMinutes * 0.05) / Math.max(strong.length, 1)),
      );
      strong.forEach((s) => {
        distribution[s.id] = {
          minutes: perSubject,
          priority: "strong",
          retention: s.retention,
          reason: `Dominio forte (${s.retention}%) — modo manutencao`,
        };
      });
      remaining -= strong.length * perSubject;
    }

    if (remaining > 0) {
      const allSubjects = [...critical, ...weak, ...medium];
      if (allSubjects.length > 0) {
        const bonus = Math.floor(remaining / allSubjects.length);
        allSubjects.forEach((s) => {
          if (distribution[s.id]) {
            distribution[s.id].minutes += bonus;
          }
        });
      }
    }

    const profile = this.getStudyProfile(critical, weak, medium, strong);
    const timeAllocation = this.calculateTimeAllocation(totalMinutes, profile);

    return {
      distribution,
      allocation: timeAllocation,
      profile,
      summary: {
        critical: critical.length,
        weak: weak.length,
        medium: medium.length,
        strong: strong.length,
        total: mastery.length,
      },
    };
  }

  defaultAllocation(totalMinutes) {
    const encoding = Math.min(15, Math.floor(totalMinutes * 0.08));
    let remaining = totalMinutes - encoding;
    const reviews = Math.floor(remaining * 0.35);
    const newContent = Math.floor(remaining * 0.35);
    const questions = remaining - reviews - newContent;

    return {
      encoding,
      reviews,
      newContent,
      questions,
      urgentReviews: 0,
    };
  }

  getStudyProfile(critical, weak, medium, strong) {
    if (critical.length > 0) {
      return "catchup";
    }
    if (weak.length > medium.length + strong.length) {
      return "building";
    }
    if (strong.length > weak.length) {
      return "maintenance";
    }
    return "balanced";
  }

  calculateTimeAllocation(totalMinutes, profile) {
    const encoding = Math.min(15, Math.floor(totalMinutes * 0.08));
    let remaining = totalMinutes - encoding;

    const profiles = {
      catchup: {
        reviews: 0.45,
        newContent: 0.25,
        questions: 0.15,
        urgentReviews: 0.15,
      },
      building: {
        reviews: 0.35,
        newContent: 0.35,
        questions: 0.2,
        urgentReviews: 0.1,
      },
      maintenance: {
        reviews: 0.25,
        newContent: 0.15,
        questions: 0.45,
        urgentReviews: 0.15,
      },
      balanced: {
        reviews: 0.35,
        newContent: 0.35,
        questions: 0.25,
        urgentReviews: 0.05,
      },
    };

    const p = profiles[profile] || profiles.balanced;
    const urgentReviews = Math.floor(remaining * (p.urgentReviews || 0));
    const reviews = Math.floor(remaining * p.reviews);
    const newContent = Math.floor(remaining * p.newContent);
    const questions = remaining - urgentReviews - reviews - newContent;

    return {
      encoding,
      urgentReviews,
      reviews,
      newContent,
      questions: Math.max(0, questions),
    };
  }

  async getRecommendedFocus(mastery) {
    const critical = mastery.filter((s) => s.critical);
    if (critical.length > 0) {
      return {
        priority: "critical",
        subjects: critical,
        message: `${critical.length} materia(s) em dominio critico — foco urgente`,
      };
    }

    const weak = mastery.filter((s) => s.weak && !s.critical);
    if (weak.length > 0) {
      return {
        priority: "weak",
        subjects: weak,
        message: `${weak.length} materia(s) precisa(m) de atencao`,
      };
    }

    const medium = mastery.filter((s) => !s.weak && s.retention < 85);
    if (medium.length > 0) {
      return {
        priority: "medium",
        subjects: medium,
        message: `Continue construindo dominio em ${medium.length} materia(s)`,
      };
    }

    return {
      priority: "strong",
      subjects: [],
      message: "Voce esta bem! Foque em manutencao e questoes.",
    };
  }
}

export const adaptiveAllocator = new AdaptiveAllocator();
