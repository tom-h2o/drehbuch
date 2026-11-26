// cardView.js
// Rendert ein Karten-Grid fuer eine Liste von Faellen (Cross/F2L/OLL/PLL).
// Jede Karte zeigt einen <twisty-player>, Name/Notation als Text und einen
// Play-Button zum Abspielen der Loesung.

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
  player.setAttribute('experimental-setup-alg', caseData.setup || '');
  player.setAttribute('alg', caseData.alg || '');
  player.classList.add('twisty-player', small ? 'twisty-small' : 'twisty-normal');
  return player;
}

function createPlayButton(player) {
  const btn = document.createElement('button');
  btn.className = 'play-btn';
  btn.type = 'button';
  btn.textContent = '▶ Lösung abspielen';
  btn.addEventListener('click', () => {
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
    player.pause();
    player.jumpToStart();
  });
  return btn;
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
    const setupLine = document.createElement('p');
    setupLine.innerHTML = `<span class="notation-label">Setup:</span> <code>${caseData.setup}</code>`;
    notation.appendChild(setupLine);
  }
  const algLine = document.createElement('p');
  algLine.innerHTML = `<span class="notation-label">Lösung:</span> <code>${caseData.alg}</code>`;
  notation.appendChild(algLine);
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

export { createTwistyPlayer, createPlayButton, createResetButton };
