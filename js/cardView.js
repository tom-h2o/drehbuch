// cardView.js
// Rendert ein Karten-Grid fuer eine Liste von Faellen (Cross/F2L/OLL/PLL).
// Jede Karte zeigt einen <twisty-player>, Name/Notation als Text und einen
// Play-Button zum Abspielen der Loesung.

import { isViewerReady, showViewerUnavailable } from './viewerStatus.js';

// cubing.js zeigt standardmaessig Weiss oben / Gelb unten. CFOP wird mit dem
// weissen Kreuz unten und Gelb oben geloest, daher wird der Wuerfel vor dem
// Setup mit z2 gedreht (Gruen bleibt vorne). Alle Zuege sind relativ zur
// aktuellen Haltung, die angezeigte Notation bleibt dadurch unveraendert.
const HOLD_ORIENTATION = 'z2';

/**
 * Baut ein <twisty-player>-Element fuer einen Fall.
 * experimental-setup-alg positioniert den Wuerfel im "Fall"-Zustand,
 * alg ist die Loesung, die per Play-Button abgespielt werden kann.
 */
function createTwistyPlayer(caseData, { small = false } = {}) {
  const player = document.createElement('twisty-player');
  player.setAttribute('puzzle', '3x3x3');
  player.setAttribute('visualization', '3D');
  player.setAttribute('background', 'none');
  player.setAttribute('control-panel', 'none');
  player.setAttribute('experimental-setup-alg', `${HOLD_ORIENTATION} ${caseData.setup || ''}`.trim());
  player.setAttribute('alg', caseData.alg || '');
  if (caseData.group === 'CROSS') {
    // Das Kreuz liegt unten und ist aus der Standard-Kamera nicht sichtbar:
    // zusaetzliche Rueckansicht von unten einblenden.
    player.setAttribute('back-view', 'top-right');
  }
  player.classList.add('twisty-player', small ? 'twisty-small' : 'twisty-normal');
  return player;
}

function createPlayButton(player) {
  const btn = document.createElement('button');
  btn.className = 'play-btn';
  btn.type = 'button';
  btn.textContent = '▶ Lösung abspielen';
  btn.addEventListener('click', () => {
    if (!isViewerReady(player)) {
      showViewerUnavailable();
      return;
    }
    player.jumpToStart();
    player.play();
  });
  return btn;
}

function createResetButton(player) {
  const btn = document.createElement('button');
  btn.className = 'reset-btn';
  btn.type = 'button';
  btn.textContent = '⟲ Zurücksetzen';
  btn.addEventListener('click', () => {
    if (!isViewerReady(player)) {
      showViewerUnavailable();
      return;
    }
    player.pause();
    player.jumpToStart();
  });
  return btn;
}

/**
 * Baut eine Zeile "<Label>: <code>alg</code>" ohne innerHTML, damit
 * Notations-Strings nie als HTML interpretiert werden.
 */
function createNotationLine(label, alg) {
  const line = document.createElement('p');
  const labelEl = document.createElement('span');
  labelEl.className = 'notation-label';
  labelEl.textContent = `${label}:`;
  const code = document.createElement('code');
  code.textContent = alg;
  line.append(labelEl, ' ', code);
  return line;
}

/**
 * Erzeugt eine einzelne Karte fuer einen Fall.
 */
export function createCard(caseData) {
  const card = document.createElement('article');
  card.className = 'case-card';
  card.dataset.caseId = caseData.id;

  const title = document.createElement('h3');
  title.className = 'case-name';
  title.textContent = caseData.name;
  card.appendChild(title);

  if (caseData.tip) {
    const tip = document.createElement('p');
    tip.className = 'case-tip';
    tip.textContent = caseData.tip;
    card.appendChild(tip);
  }

  const playerWrap = document.createElement('div');
  playerWrap.className = 'twisty-wrap';
  const player = createTwistyPlayer(caseData);
  playerWrap.appendChild(player);
  card.appendChild(playerWrap);

  const controls = document.createElement('div');
  controls.className = 'card-controls';
  controls.appendChild(createPlayButton(player));
  controls.appendChild(createResetButton(player));
  card.appendChild(controls);

  const notation = document.createElement('div');
  notation.className = 'case-notation';
  if (caseData.setup) {
    notation.appendChild(createNotationLine('Setup', caseData.setup));
  }
  notation.appendChild(createNotationLine('Lösung', caseData.alg));
  card.appendChild(notation);

  return card;
}

/**
 * Rendert eine Liste von Faellen als Karten-Grid in den gegebenen Container.
 * @param {HTMLElement} container
 * @param {Array} cases
 */
export function renderCards(container, cases) {
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  cases.forEach((caseData) => {
    fragment.appendChild(createCard(caseData));
  });
  container.appendChild(fragment);
}

export { createTwistyPlayer, createPlayButton, createResetButton, createNotationLine };
