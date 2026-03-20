import { z } from "zod";

/**
 * Schema para Matéria (Subject)
 */
export const SubjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "O nome da matéria é obrigatório").max(100),
  shortName: z.string().max(20).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{3,6}$/, "Cor inválida").default("#0ea5e9"),
  weight: z.number().min(0).max(100).default(10),
  questionCount: z.number().min(0).default(0),
  cycleMinutes: z.number().min(1).max(1440).default(60),
  proficiencyLevel: z.number().min(0).max(100).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

/**
 * Schema para Cartão (Flashcard/Question)
 */
export const CardSchema = z.object({
  id: z.number().optional(),
  subjectId: z.number({ required_error: "A matéria é obrigatória" }),
  topicId: z.number({ required_error: "O tópico é obrigatório" }),
  type: z.enum(["flashcard", "question"]).default("flashcard"),
  content: z.object({
    front: z.string().min(1, "A frente/pergunta é obrigatória").max(10000).optional(),
    back: z.string().max(10000).optional(),
    question: z.string().min(1, "A pergunta é obrigatória").max(10000).optional(),
    explanation: z.string().max(10000).optional()
  }),
  state: z.enum(["new", "learning", "review", "relearning"]).default("new"),
  difficulty: z.number().min(0).max(10).optional(),
  stability: z.number().min(0).optional(),
  retrievability: z.number().min(0).optional(),
  due: z.string().datetime().optional(),
  lastReview: z.string().datetime().optional(),
  reps: z.number().min(0).optional(),
  lapses: z.number().min(0).optional(),
  suspended: z.boolean().default(false),
  buried: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

/**
 * Schema para Configuração (Config)
 */
export const ConfigSchema = z.object({
  userName: z.string().max(100).optional(),
  targetExam: z.object({
    name: z.string().max(100).optional(),
    date: z.string().nullable().optional(),
    institution: z.string().max(100).optional()
  }).optional(),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    pomodoroEnabled: z.boolean().default(true),
    feynmanEnabled: z.boolean().default(false),
    newCardsPerDay: z.number().min(1).max(500).default(20),
    maxReviewsPerDay: z.number().min(1).max(2000).default(200)
  }).optional(),
  fsrsParams: z.object({
    requestRetention: z.number().min(0.7).max(0.99).default(0.85),
    maximumInterval: z.number().min(1).max(36500).default(365)
  }).optional(),
  schedule: z.object({
    weeklyHours: z.number().min(1).max(168).default(20)
  }).optional(),
  tutor: z.object({
    mode: z.enum(["passive", "active", "strict"]).default("active")
  }).optional()
});
