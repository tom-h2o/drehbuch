// app.js
// Einstiegspunkt: Tab-Navigation, Laden der Datenmodule und Initialisierung
// von Karten-Ansicht und Quiz-Modus.

import { CROSS_TIPS } from './data/cross.js';
import { F2L_CASES } from './data/f2l.js';
import { OLL_CASES } from './data/oll.js';
import { PLL_CASES } from './data/pll.js';
import { renderCards } from './cardView.js';
import { initQuiz } from './quiz.js';
import { watchViewerLoad } from './viewerStatus.js';

const renderedTabs = new Set(['cross']);

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === `panel-${target}`);
      });

      // Lazy render the target panel if not already rendered
      if (!renderedTabs.has(target)) {
        if (target === 'f2l') {
          renderCards(document.getElementById('grid-f2l'), F2L_CASES);
          renderedTabs.add('f2l');
        } else if (target === 'oll') {
          renderCards(document.getElementById('grid-oll'), OLL_CASES);
          renderedTabs.add('oll');
        } else if (target === 'pll') {
          renderCards(document.getElementById('grid-pll'), PLL_CASES);
          renderedTabs.add('pll');
        }
      }

      // Force recalculation/resize on active tab panels
      window.dispatchEvent(new Event('resize'));
    });
  });
}

function initCardGrids() {
  // Only render the active tab (cross) initially.
  // F2L, OLL, and PLL cards are rendered lazily when their tabs are activated.
  renderCards(document.getElementById('grid-cross'), CROSS_TIPS);
}

function init() {
  watchViewerLoad();
  initTabs();
  initCardGrids();
  initQuiz();
}

document.addEventListener('DOMContentLoaded', init);

