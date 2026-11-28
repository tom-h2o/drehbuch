// progress.js
// Persistiert den Lernfortschritt pro Fall (case id) in localStorage und
// stellt eine einfache Leitner-artige Gewichtung fuer den Quiz-Modus bereit.

const STORAGE_KEY = 'cfop-trainer-progress-v1';
const MAX_BOX = 5;
const MIN_BOX = 1;

// Gewicht je Leitner-Box (Index = Box):
// - Box 0: nie gesehen
// - Box 1: zuletzt falsch -> hoechstes Gewicht, kommt haeufiger als neue Faelle
// - Box 2..5: richtig geloest, je hoeher desto seltener
const BOX_WEIGHTS = [6, 10, 4, 3, 2, 1];

const EMPTY_STATS = Object.freeze({ seen: 0, correct: 0, box: 0, lastSeen: 0 });

function toCount(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Macht aus einem (evtl. unvollstaendigen oder kaputten) gespeicherten
 * Eintrag ein vollstaendiges Statistik-Objekt mit gueltigen Zahlen.
 */
function normalizeStats(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATS };
  const box = Number.isInteger(raw.box) ? Math.min(MAX_BOX, Math.max(0, raw.box)) : 0;
  return {
    seen: toCount(raw.seen),
    correct: toCount(raw.correct),
    box,
    lastSeen: toCount(raw.lastSeen),
  };
}

/**
 * @returns {Object<string, {seen:number, correct:number, box:number, lastSeen:number}>}
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    console.warn('Konnte Fortschritt nicht laden, starte leer.', err);
    return {};
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Konnte Fortschritt nicht speichern.', err);
  }
}

export function getCaseStats(caseId, progress = loadProgress()) {
  return normalizeStats(progress[caseId]);
}

/**
 * Zeichnet das Ergebnis einer Selbsteinschaetzung im Quiz auf.
 * Richtig loesen erhoeht die Leitner-Box (seltener dran, ein neuer Fall
 * springt direkt in Box 2), falsch loesen setzt die Box auf 1 (haeufiger dran
 * als jeder andere Fall).
 */
export function recordResult(caseId, wasCorrect) {
  const progress = loadProgress();
  const prev = normalizeStats(progress[caseId]);
  const nextBox = wasCorrect
    ? Math.min(MAX_BOX, Math.max(prev.box, MIN_BOX) + 1)
    : MIN_BOX;
  progress[caseId] = {
    seen: prev.seen + 1,
    correct: prev.correct + (wasCorrect ? 1 : 0),
    box: nextBox,
    lastSeen: Date.now(),
  };
  saveProgress(progress);
  return progress[caseId];
}

/**
 * Gewichtung fuer die zufaellige Fallauswahl im Quiz (siehe BOX_WEIGHTS).
 * Lange nicht gesehene Faelle bekommen zusaetzlich einen kleinen Bonus
 * ("Auffrischen").
 * @param {string} caseId
 * @param {Object} [progress] bereits geladener Fortschritt (spart erneutes Parsen)
 */
export function weightFor(caseId, progress = loadProgress()) {
  const stats = getCaseStats(caseId, progress);
  let weight = BOX_WEIGHTS[stats.box];

  if (stats.lastSeen) {
    const daysSince = (Date.now() - stats.lastSeen) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) weight += 2;
    else if (daysSince > 2) weight += 1;
  }
  return Math.max(1, weight);
}

/**
 * Waehlt einen Fall aus der Liste zufaellig, gewichtet nach Lernfortschritt.
 * @param {Array<{id:string}>} cases
 * @param {string|null} [excludeId] Fall, der nicht direkt wieder gezogen werden
 *   soll (z.B. der gerade beantwortete). Wird ignoriert, wenn es nur einen Fall gibt.
 * @returns {Object|null}
 */
export function pickWeighted(cases, excludeId = null) {
  if (!cases || cases.length === 0) return null;
  let pool = cases;
  if (excludeId != null && cases.length > 1) {
    const filtered = cases.filter((c) => c.id !== excludeId);
    if (filtered.length > 0) pool = filtered;
  }
  const progress = loadProgress();
  const weights = pool.map((c) => weightFor(c.id, progress));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Aggregierte Statistik fuer eine Gruppe von Faellen (z.B. fuer Anzeige im Quiz-Tab).
 */
export function getGroupStats(cases) {
  const progress = loadProgress();
  let seenCases = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;
  let mastered = 0;

  cases.forEach((c) => {
    const stats = getCaseStats(c.id, progress);
    if (stats.seen > 0) {
      seenCases += 1;
      totalAttempts += stats.seen;
      totalCorrect += stats.correct;
      if (stats.box >= MAX_BOX) mastered += 1;
    }
  });

  return {
    totalCases: cases.length,
    seenCases,
    totalAttempts,
    totalCorrect,
    mastered,
  };
}
