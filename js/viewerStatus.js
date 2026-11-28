// viewerStatus.js
// Zeigt einen Hinweis an, wenn der 3D-Wuerfel (cubing.js <twisty-player>,
// geladen von cdn.cubing.net) nicht verfuegbar ist.

const BANNER_ID = 'viewer-status';
const LOAD_TIMEOUT_MS = 10000;

export function isViewerReady(player) {
  return Boolean(player) && typeof player.play === 'function' && typeof player.jumpToStart === 'function';
}

export function showViewerUnavailable() {
  if (document.getElementById(BANNER_ID)) return;
  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'status-banner';
  banner.setAttribute('role', 'alert');
  banner.textContent =
    'Der 3D-Würfel konnte nicht geladen werden (cubing.js von cdn.cubing.net). ' +
    'Prüfe deine Internetverbindung und lade die Seite neu.';
  const main = document.getElementById('main');
  (main || document.body).prepend(banner);
}

function hideViewerUnavailable() {
  document.getElementById(BANNER_ID)?.remove();
}

/**
 * Ueberwacht das Laden von <twisty-player>. Schlaegt das Laden des Moduls fehl
 * (index.html setzt dann data-twisty-failed) oder dauert es zu lange, wird ein
 * Hinweis angezeigt. Wird der Player spaeter doch noch definiert, verschwindet
 * der Hinweis wieder.
 */
export function watchViewerLoad() {
  if (customElements.get('twisty-player')) return;
  if (document.documentElement.dataset.twistyFailed) {
    showViewerUnavailable();
    return;
  }
  const timer = setTimeout(showViewerUnavailable, LOAD_TIMEOUT_MS);
  customElements.whenDefined('twisty-player').then(() => {
    clearTimeout(timer);
    hideViewerUnavailable();
  });
}
