// progress.js
// Persistiert den Lernfortschritt pro Fall (case id) in localStorage und
// stellt eine einfache Leitner-artige Gewichtung fuer den Quiz-Modus bereit.

const STORAGE_KEY = 'cfop-trainer-progress-v1';
const MAX_BOX = 5;
const MIN_BOX = 1;

/**
 * @returns {Object<string, {seen:number, correct:number, box:number, lastSeen:number}>}
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
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

export function getCaseStats(caseId) {
  const progress = loadProgress();
  return (
    progress[caseId] || { seen: 0, correct: 0, box: 0, lastSeen: 0 }
  );
}

/**
 * Zeichnet das Ergebnis einer Selbsteinschaetzung im Quiz auf.
 * Richtig loesen erhoeht die Leitner-Box (seltener dran), falsch loesen
 * setzt die Box zurueck auf 1 (haeufiger dran).
 */
export function recordResult(caseId, wasCorrect) {
  const progress = loadProgress();
  const prev = progress[caseId] || { seen: 0, correct: 0, box: 0, lastSeen: 0 };
  const nextBox = wasCorrect
    ? Math.min(MAX_BOX, (prev.box || 0) + 1)
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
 * Gewichtung fuer die zufaellige Fallauswahl im Quiz:
 * - Nie gesehene Faelle (box 0) bekommen das hoechste Gewicht.
 * - Niedrige Box (oft falsch) => hohes Gewicht (wird oefter abgefragt).
 * - Hohe Box (oft richtig) => niedriges Gewicht (wird seltener abgefragt).
 * - Lange nicht gesehene Faelle bekommen einen kleinen Bonus ("Auffrischen").
 */
export function weightFor(caseId) {
  const stats = getCaseStats(caseId);
  const box = stats.box || 0;
  let weight = MAX_BOX + 1 - box; // box 0 -> 6, box 5 -> 1

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
 * @returns {Object|null}
 */
export function pickWeighted(cases) {
  if (!cases || cases.length === 0) return null;
  const weights = cases.map((c) => weightFor(c.id));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < cases.length; i++) {
    r -= weights[i];
    if (r <= 0) return cases[i];
  }
  return cases[cases.length - 1];
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
    const stats = progress[c.id];
    if (stats && stats.seen > 0) {
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
