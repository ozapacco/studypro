import { db } from '../db.js';

// Funções de utilidade movidas do studeiBackup.js
const DEFAULT_SUBJECT_COLOR = '#0ea5e9';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tryFixMojibake(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed || !/[ÃÂ]/.test(trimmed)) return trimmed;
  try {
    const bytes = Uint8Array.from(trimmed, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes).trim().replace(/\s+/g, ' ');
    if (!decoded || decoded.includes('\uFFFD')) return trimmed;
    return decoded;
  } catch {
    return trimmed;
  }
}

function sanitizeName(value) {
  return tryFixMojibake(String(value || '').trim());
}

function buildSubjectKeys(name) {
  const normalized = normalizeText(name);
  const keys = new Set([normalized]);
  const withoutNocoes = normalized.replace(/^nocoes de /, '').trim();
  if (withoutNocoes) keys.add(withoutNocoes);
  const withoutLingua = normalized.replace(/^lingua /, '').trim();
  if (withoutLingua) keys.add(withoutLingua);
  if (normalized.includes('tecnologia da informacao')) {
    keys.add('informatica');
    keys.add('ti');
  }
  if (normalized.includes('direito processual penal')) keys.add('processual penal');
  if (normalized.includes('direito constitucional')) keys.add('constitucional');
  if (normalized.includes('direito administrativo')) keys.add('administrativo');
  if (normalized.includes('direito penal')) keys.add('penal');
  if (normalized.includes('lingua portuguesa')) keys.add('portugues');
  return keys;
}

function buildSubjectIndex(subjects) {
  const byKey = new Map();
  for (const subject of subjects) {
    const keys = buildSubjectKeys(subject.name || '');
    for (const key of keys) {
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, subject.id);
    }
  }
  return byKey;
}

function findSubjectIdByHints(subjectIndex, hints = []) {
  for (const hint of hints) {
    const key = normalizeText(hint);
    if (!key) continue;
    if (subjectIndex.has(key)) return subjectIndex.get(key);
  }
  for (const hint of hints) {
    const key = normalizeText(hint);
    if (!key) continue;
    for (const [subjectKey, subjectId] of subjectIndex.entries()) {
      if (subjectKey.includes(key) || key.includes(subjectKey)) return subjectId;
    }
  }
  return null;
}

async function buildTopicIndex() {
  const topics = await db.topics.toArray();
  const topicIndex = new Map();
  for (const topic of topics) {
    const entry = topicIndex.get(topic.subjectId) || { names: new Set(), nextOrder: 1 };
    const key = normalizeText(topic.name || '');
    if (key) entry.names.add(key);
    const currentOrder = Number(topic.order || 0);
    if (currentOrder >= entry.nextOrder) entry.nextOrder = currentOrder + 1;
    topicIndex.set(topic.subjectId, entry);
  }
  return topicIndex;
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'IMPORT_STUDEI') {
    try {
      const { disciplinas, assuntos } = payload;
      const now = new Date().toISOString();
      const report = {
        subjectsCreated: 0,
        subjectsUpdated: 0,
        topicsCreated: 0,
        topicsSkippedDuplicate: 0,
        unresolvedAssuntos: 0,
        legacyDisciplinaMapped: 0
      };

      await db.transaction('rw', db.subjects, db.topics, async () => {
        const existingSubjects = await db.subjects.orderBy('order').toArray();
        const subjectIndex = buildSubjectIndex(existingSubjects);
        let nextOrder = (existingSubjects.reduce((max, current) => Math.max(max, Number(current.order || 0)), 0) || 0) + 1;

        const backupDisciplinaToSubjectId = new Map();
        for (const disciplina of disciplinas) {
          const name = sanitizeName(disciplina?.nome);
          if (!name) continue;

          const hints = [...buildSubjectKeys(name)];
          let subjectId = findSubjectIdByHints(subjectIndex, hints);

          const subjectPayload = {
            name,
            shortName: name.slice(0, 8),
            color: disciplina?.cor || DEFAULT_SUBJECT_COLOR,
            weight: Math.max(1, Math.min(100, Math.round(Number(disciplina?.pesoEdital ?? 1)))),
            updatedAt: now
          };

          if (subjectId) {
            await db.subjects.update(subjectId, subjectPayload);
            report.subjectsUpdated += 1;
          } else {
            subjectId = await db.subjects.add({
              ...subjectPayload,
              order: nextOrder++,
              stats: { totalCards: 0, matureCards: 0, learningCards: 0, newCards: 0, averageEase: 5, retention: 0 },
              createdAt: now
            });
            report.subjectsCreated += 1;
          }
          backupDisciplinaToSubjectId.set(disciplina.id, subjectId);
          const keys = buildSubjectKeys(name);
          for (const key of keys) {
            if (!subjectIndex.has(key)) subjectIndex.set(key, subjectId);
          }
        }

        const topicIndex = await buildTopicIndex();
        for (const assunto of assuntos) {
          const topicName = sanitizeName(assunto?.nome);
          if (!topicName) continue;

          const disciplinaId = String(assunto?.disciplinaId || '').trim();
          let subjectId = backupDisciplinaToSubjectId.get(disciplinaId) || null;

          if (!subjectId) {
            // Mais lógica de mapeamento legado aqui se necessário
            report.unresolvedAssuntos++;
            continue;
          }

          const topicKey = normalizeText(topicName);
          const current = topicIndex.get(subjectId) || { names: new Set(), nextOrder: 1 };
          if (topicKey && current.names.has(topicKey)) {
            report.topicsSkippedDuplicate += 1;
            continue;
          }

          await db.topics.add({
            subjectId,
            name: topicName,
            order: current.nextOrder++,
            importance: 3,
            createdAt: now,
            updatedAt: now
          });
          if (topicKey) current.names.add(topicKey);
          topicIndex.set(subjectId, current);
          report.topicsCreated += 1;
        }
      });

      self.postMessage({ type: 'SUCCESS', report });
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: error.message });
    }
  }
};
