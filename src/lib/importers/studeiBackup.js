import { db } from '$lib/db.js';

const DEFAULT_SUBJECT_COLOR = '#0ea5e9';
const LEGACY_DISCIPLINA_HINTS = {
  ml9azw03l0ek3cvqlg: ['direito processual penal', 'processual penal'],
  ml9b23e8kppilh3gtks: ['lingua portuguesa', 'portugues'],
  ml9b23e9lu6k7wcoqn: ['tecnologia da informacao', 'informatica', 'ti'],
  ml9b23ea6ps0ez14ln: ['contabilidade'],
  ml9b23ecnxf0vffz1t8: ['direito penal', 'penal'],
  mlbgjkmozugpmdhvp: ['direito penal', 'penal'],
  ml9bo3o2sd24rec7xg9: ['direito processual penal', 'processual penal'],
  ml9bx289b4vnn582tqe: ['direito constitucional', 'constitucional'],
  ml9c0u2sqn8chpxqltd: ['direito administrativo', 'administrativo'],
  // Novos IDs do backup do usuário
  mlarvsx5povl0141bqm: ['processual penal'],
  mlarvsxsjl8juattxu: ['constitucional'],
  mlarvsy884z8h5wsmtn: ['administrativo'],
  mlarvsyh5e5frv8lbxy: ['direitos humanos'],
  mlarvsyrlvs6dl5thh: ['legislacao institucional'],
  mlarvsyyqh9qjfed7wo: ['ti', 'informatica'],
  mlarvszyqn7zca46lj: ['contabilidade'],
  mlarvt0csmm7qmmvagk: ['portugues'],
  mlarvt14jjidqeh1zlo: ['raciocinio logico'],
  mlc4zese393b1e2rssv: ['direito penal']
};

const ASSUNTO_HINTS = [
  { match: ['portugues'], hints: ['lingua portuguesa', 'portugues'] },
  { match: ['informatica', 'cibernetica', 'redes', 'telecomunicacoes', 'cloud'], hints: ['tecnologia da informacao', 'informatica'] },
  { match: ['contabilidade', 'balanco', 'ativo', 'passivo'], hints: ['contabilidade'] },
  { match: ['processual penal', 'inquerito', 'acao penal', 'cpp'], hints: ['direito processual penal', 'processual penal'] },
  { match: ['constituicao', 'constitucional', 'garantias fundamentais'], hints: ['direito constitucional', 'constitucional'] },
  { match: ['administrativo', 'agentes publicos', 'licitacoes'], hints: ['direito administrativo', 'administrativo'] },
  { match: ['tipicidade', 'ilicitude', 'culpabilidade', 'punibilidade', 'direito penal'], hints: ['direito penal', 'penal'] }
];

function nowISO() {
  return new Date().toISOString();
}

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

function clampWeight(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.min(100, Math.round(number)));
}

function normalizeColor(value) {
  const normalized = String(value || '').trim();
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(normalized) ? normalized : DEFAULT_SUBJECT_COLOR;
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

function inferHintsFromAssuntoName(assuntoName) {
  const normalized = normalizeText(assuntoName);
  if (!normalized) return [];

  const inferred = [];
  for (const item of ASSUNTO_HINTS) {
    if (item.match.some((token) => normalized.includes(token))) {
      inferred.push(...item.hints);
    }
  }

  return inferred;
}

function ensureSubjectStats(subject = {}) {
  return (
    subject.stats || {
      totalCards: 0,
      matureCards: 0,
      learningCards: 0,
      newCards: 0,
      averageEase: 5,
      retention: 0
    }
  );
}

function defaultTopicRecord(subjectId, name, order) {
  const now = nowISO();
  return {
    subjectId,
    name,
    order,
    theory: { totalLessons: 0, completedLessons: 0 },
    importance: 3,
    difficulty: 3,
    tags: [],
    stats: { totalCards: 0, averageRetention: 0 },
    createdAt: now,
    updatedAt: now
  };
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

export function isStudeiBackupPayload(payload) {
  return Boolean(
    payload &&
      payload.data &&
      Array.isArray(payload.data.app_disciplinas) &&
      Array.isArray(payload.data.app_assuntos)
  );
}

export async function importStudeiBackupPayload(payload) {
  if (!isStudeiBackupPayload(payload)) {
    throw new Error('Formato invalido para studei_backup.json');
  }

  return new Promise((resolve, reject) => {
    try {
      // Use Vite's worker constructor
      const worker = new Worker(new URL('./importWorker.js', import.meta.url), { type: 'module' });

      worker.onmessage = (e) => {
        const { type, report, error } = e.data;
        if (type === 'SUCCESS') {
          resolve(report);
          worker.terminate();
        } else if (type === 'ERROR') {
          reject(new Error(error));
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        reject(new Error('Worker error: ' + err.message));
        worker.terminate();
      };

      worker.postMessage({
        type: 'IMPORT_STUDEI',
        payload: {
          disciplinas: payload.data.app_disciplinas,
          assuntos: payload.data.app_assuntos
        }
      });
    } catch (err) {
      reject(new Error('Failed to initialize import worker: ' + err.message));
    }
  });
}
