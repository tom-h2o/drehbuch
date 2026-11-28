// quiz.js
// Quiz-Modus: Phase waehlbar, zeigt zufaellig (gewichtet nach Fortschritt)
// einen Scramble-Zustand eines Falls. User deckt die Loesung auf und bewertet
// sich selbst richtig/falsch. Fortschritt wird via progress.js persistiert.

import { F2L_CASES } from './data/f2l.js';
import { OLL_CASES } from './data/oll.js';
import { PLL_CASES } from './data/pll.js';
import { pickWeighted, recordResult, getGroupStats } from './progress.js';
import {
  createTwistyPlayer,
  createPlayButton,
  createResetButton,
  createNotationLine,
} from './cardView.js';

const PHASE_CASES = {
  f2l: F2L_CASES,
  oll: OLL_CASES,
  pll: PLL_CASES,
};

const ADVANCE_DELAY_MS = 900;

let currentCase = null;
let els = null;
let advanceTimer = null;

function cancelPendingAdvance() {
  if (advanceTimer !== null) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function renderStats(phaseKey) {
  const cases = PHASE_CASES[phaseKey];
  const stats = getGroupStats(cases);
  els.stats.textContent =
    `${stats.seenCases}/${stats.totalCases} Fälle geübt · ` +
    `${stats.totalCorrect}/${stats.totalAttempts || 0} richtig gesamt · ` +
    `${stats.mastered} gemeistert`;
}

function nextCase() {
  // Ein noch ausstehender Auto-Weiter-Timer (nach einer Bewertung) darf den
  // jetzt gezogenen Fall nicht kurz darauf wieder ersetzen.
  cancelPendingAdvance();
  const phaseKey = els.phaseSelect.value;
  const cases = PHASE_CASES[phaseKey];
  const previousId = currentCase ? currentCase.id : null;
  currentCase = pickWeighted(cases, previousId);
  renderQuizCard(phaseKey);
  renderStats(phaseKey);
}

function renderQuizCard(phaseKey) {
  els.cardWrap.innerHTML = '';
  if (!currentCase) {
    const p = document.createElement('p');
    p.className = 'quiz-placeholder';
    p.textContent = 'Keine Fälle in dieser Phase vorhanden.';
    els.cardWrap.appendChild(p);
    return;
  }

  const card = document.createElement('div');
  card.className = 'quiz-card';

  const label = document.createElement('div');
  label.className = 'quiz-phase-label';
  label.textContent = phaseKey.toUpperCase();
  card.appendChild(label);

  const playerWrap = document.createElement('div');
  playerWrap.className = 'twisty-wrap';
  const player = createTwistyPlayer(currentCase);
  playerWrap.appendChild(player);
  card.appendChild(playerWrap);

  const revealArea = document.createElement('div');
  revealArea.className = 'quiz-reveal-area';

  const revealBtn = document.createElement('button');
  revealBtn.className = 'reveal-btn';
  revealBtn.type = 'button';
  revealBtn.textContent = 'Lösung aufdecken';
  revealArea.appendChild(revealBtn);

  const hiddenInfo = document.createElement('div');
  hiddenInfo.className = 'quiz-hidden-info';
  hiddenInfo.hidden = true;

  const nameEl = document.createElement('h3');
  nameEl.textContent = currentCase.name;
  hiddenInfo.appendChild(nameEl);

  if (currentCase.tip) {
    const tipEl = document.createElement('p');
    tipEl.className = 'case-tip';
    tipEl.textContent = currentCase.tip;
    hiddenInfo.appendChild(tipEl);
  }

  hiddenInfo.appendChild(createNotationLine('Lösung', currentCase.alg));

  const controls = document.createElement('div');
  controls.className = 'card-controls';
  controls.appendChild(createPlayButton(player));
  controls.appendChild(createResetButton(player));
  hiddenInfo.appendChild(controls);

  const rateArea = document.createElement('div');
  rateArea.className = 'quiz-rate-area';
  const rightBtn = document.createElement('button');
  rightBtn.className = 'rate-btn rate-correct';
  rightBtn.type = 'button';
  rightBtn.textContent = '✓ Richtig';
  const wrongBtn = document.createElement('button');
  wrongBtn.className = 'rate-btn rate-wrong';
  wrongBtn.type = 'button';
  wrongBtn.textContent = '✗ Falsch';
  rateArea.appendChild(rightBtn);
  rateArea.appendChild(wrongBtn);
  hiddenInfo.appendChild(rateArea);

  revealArea.appendChild(hiddenInfo);
  card.appendChild(revealArea);

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback';
  card.appendChild(feedback);

  revealBtn.addEventListener('click', () => {
    hiddenInfo.hidden = false;
    revealBtn.hidden = true;
  });

  function rate(correct) {
    recordResult(currentCase.id, correct);
    feedback.textContent = correct
      ? 'Gespeichert: richtig. Nächster Fall …'
      : 'Gespeichert: falsch. Dieser Fall wird ab jetzt häufiger abgefragt.';
    rightBtn.disabled = true;
    wrongBtn.disabled = true;
    renderStats(phaseKey);
    cancelPendingAdvance();
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      nextCase();
    }, ADVANCE_DELAY_MS);
  }

  rightBtn.addEventListener('click', () => rate(true));
  wrongBtn.addEventListener('click', () => rate(false));

  els.cardWrap.appendChild(card);
}

export function initQuiz() {
  els = {
    phaseSelect: document.getElementById('quiz-phase'),
    startBtn: document.getElementById('quiz-start'),
    stats: document.getElementById('quiz-stats'),
    cardWrap: document.getElementById('quiz-card-wrap'),
  };

  els.startBtn.addEventListener('click', () => {
    nextCase();
  });

  els.phaseSelect.addEventListener('change', () => {
    // Laeuft bereits eine Runde, sofort einen Fall der neuen Phase zeigen,
    // damit Karte, Bewertung und Statistik zur gewaehlten Phase passen.
    if (currentCase) {
      nextCase();
    } else {
      renderStats(els.phaseSelect.value);
    }
  });

  renderStats(els.phaseSelect.value);
}
