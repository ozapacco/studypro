import { db } from './db.js';

function nowISO() {
  return new Date().toISOString();
}

function buildCard(subjectId, topicId, front, back) {
  const now = nowISO();
  return {
    subjectId,
    topicId,
    type: 'flashcard',
    content: {
      front,
      back
    },
    state: 'new',
    stability: 0,
    difficulty: 5,
    due: now,
    reps: 0,
    lapses: 0,
    lastReview: null,
    lastRating: null,
    suspended: false,
    buried: false,
    flagged: false,
    stats: {
      totalReviews: 0,
      correctCount: 0,
      incorrectCount: 0,
      averageTime: 0,
      streak: 0
    },
    createdAt: now,
    updatedAt: now
  };
}

export async function seedStarterData() {
  const existingSubjects = await db.subjects.count();
  if (existingSubjects > 0) {
    return { created: false, reason: 'subjects_already_exist' };
  }

  const now = nowISO();
  const subjectIds = await db.subjects.bulkAdd(
    [
      {
        name: 'Direito Constitucional',
        shortName: 'DConst',
        color: '#2563eb',
        weight: 25,
        questionCount: 20,
        cycleMinutes: 60,
        proficiencyLevel: 20,
        order: 1,
        stats: {
          totalCards: 0,
          matureCards: 0,
          learningCards: 0,
          newCards: 0,
          averageEase: 5,
          retention: 0
        },
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Português',
        shortName: 'Port',
        color: '#059669',
        weight: 20,
        questionCount: 15,
        cycleMinutes: 50,
        proficiencyLevel: 30,
        order: 2,
        stats: {
          totalCards: 0,
          matureCards: 0,
          learningCards: 0,
          newCards: 0,
          averageEase: 5,
          retention: 0
        },
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Raciocínio Lógico',
        shortName: 'RLM',
        color: '#d97706',
        weight: 15,
        questionCount: 10,
        cycleMinutes: 45,
        proficiencyLevel: 15,
        order: 3,
        stats: {
          totalCards: 0,
          matureCards: 0,
          learningCards: 0,
          newCards: 0,
          averageEase: 5,
          retention: 0
        },
        createdAt: now,
        updatedAt: now
      }
    ],
    { allKeys: true }
  );

  const topicIds = await db.topics.bulkAdd(
    [
      {
        subjectId: subjectIds[0],
        name: 'Direitos e Garantias Fundamentais',
        order: 1,
        theory: { totalLessons: 4, completedLessons: 0 },
        importance: 5,
        difficulty: 4,
        tags: ['art5', 'garantias'],
        stats: { totalCards: 0, averageRetention: 0 },
        createdAt: now,
        updatedAt: now
      },
      {
        subjectId: subjectIds[1],
        name: 'Interpretação de Texto',
        order: 1,
        theory: { totalLessons: 3, completedLessons: 0 },
        importance: 5,
        difficulty: 3,
        tags: ['interpretacao'],
        stats: { totalCards: 0, averageRetention: 0 },
        createdAt: now,
        updatedAt: now
      },
      {
        subjectId: subjectIds[2],
        name: 'Proposições e Conectivos',
        order: 1,
        theory: { totalLessons: 3, completedLessons: 0 },
        importance: 4,
        difficulty: 4,
        tags: ['logica'],
        stats: { totalCards: 0, averageRetention: 0 },
        createdAt: now,
        updatedAt: now
      }
    ],
    { allKeys: true }
  );

  await db.lessons.bulkAdd([
    {
      topicId: topicIds[0],
      order: 1,
      title: 'Conceitos básicos de direitos fundamentais',
      completed: false,
      createdAt: now
    },
    {
      topicId: topicIds[1],
      order: 1,
      title: 'Estratégias de leitura e inferência',
      completed: false,
      createdAt: now
    },
    {
      topicId: topicIds[2],
      order: 1,
      title: 'Tabela-verdade e conectivos',
      completed: false,
      createdAt: now
    }
  ]);

  const cards = [
    buildCard(subjectIds[0], topicIds[0], 'O que é cláusula pétrea?', 'É uma limitação material ao poder de reforma constitucional.'),
    buildCard(subjectIds[0], topicIds[0], 'Quais são os remédios constitucionais?', 'HC, MS, MI, HD, ação popular e ADPF/ADI em outro plano de controle.'),
    buildCard(subjectIds[0], topicIds[0], 'Diferença entre direitos e garantias', 'Direitos são bens protegidos; garantias são instrumentos de proteção.'),
    buildCard(subjectIds[1], topicIds[1], 'O que é inferência textual?', 'Conclusão lógica obtida a partir de pistas do texto.'),
    buildCard(subjectIds[1], topicIds[1], 'Coesão x coerência', 'Coesão: ligação formal; coerência: sentido global.'),
    buildCard(subjectIds[1], topicIds[1], 'Função da pontuação na interpretação', 'Organiza sintaxe e altera sentido de enunciados.'),
    buildCard(subjectIds[2], topicIds[2], 'Negação de P -> Q', 'Equivale a P e não Q.'),
    buildCard(subjectIds[2], topicIds[2], 'Conectivo bicondicional', 'Verdadeiro quando ambos têm o mesmo valor lógico.'),
    buildCard(subjectIds[2], topicIds[2], 'Lei de De Morgan', 'negação(P e Q)=não P ou não Q; negação(P ou Q)=não P e não Q.')
  ];

  await db.cards.bulkAdd(cards);

  return {
    created: true,
    subjects: subjectIds.length,
    topics: topicIds.length,
    cards: cards.length
  };
}
