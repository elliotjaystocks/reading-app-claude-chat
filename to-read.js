/**
 * to-read.js — To Read page (tabs: Bought & Ready / Want to Read Someday)
 */

import { isConfigured }                                    from './github.js';
import { loadDB }                                          from './state.js';
import {
  openSearchModal,
  openSettingsModal,
  renderBookRow,
  showToast,
  ICON_BOOK_OPEN,
  ICON_PLUS,
  ICON_SEARCH_NAV,
  ICON_SETTINGS_NAV,
} from './ui.js';

// Inject nav icons
document.getElementById('btn-search').innerHTML   = ICON_SEARCH_NAV;
document.getElementById('btn-settings').innerHTML = ICON_SETTINGS_NAV;

document.getElementById('btn-search').addEventListener('click', () => {
  openSearchModal(activeTab());
});

document.getElementById('btn-settings').addEventListener('click', () => {
  openSettingsModal(false);
});

document.getElementById('btn-add').addEventListener('click', () => {
  openSearchModal(activeTab());
});

// ----------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------

const TABS = [
  { id: 'to-read-bought',   label: 'Bought & Ready',        panelId: 'panel-bought'  },
  { id: 'to-read-someday',  label: 'Want to Read Someday',  panelId: 'panel-someday' },
];

function activeTab() {
  const btn = document.querySelector('.tab-btn[aria-selected="true"]');
  return btn ? btn.dataset.list : TABS[0].id;
}

function initTabs() {
  const tabRow = document.getElementById('tab-row');
  tabRow.innerHTML = TABS.map((t, i) => `
    <button
      class="tab-btn"
      data-list="${t.id}"
      data-panel="${t.panelId}"
      aria-selected="${i === 0 ? 'true' : 'false'}"
    >${t.label}</button>
  `).join('');

  tabRow.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.list));
  });
}

function switchTab(listId) {
  TABS.forEach(t => {
    const btn   = document.querySelector(`.tab-btn[data-list="${t.id}"]`);
    const panel = document.getElementById(t.panelId);
    const active = t.id === listId;
    btn.setAttribute('aria-selected', String(active));
    panel.classList.toggle('active', active);
  });
}

// ----------------------------------------------------------------
// Render helpers
// ----------------------------------------------------------------

function renderPanel(books, listId, emptyMessage) {
  if (books.length === 0) {
    return `
      <div class="empty-state">
        ${ICON_BOOK_OPEN}
        <p>${emptyMessage}</p>
        <button class="btn btn-primary empty-add-btn" data-list="${listId}">
          ${ICON_PLUS} Add a book
        </button>
      </div>
    `;
  }
  return `<div class="book-list">${books.map(b => renderBookRow(b, listId)).join('')}</div>`;
}

// ----------------------------------------------------------------
// Boot
// ----------------------------------------------------------------

async function init() {
  const loading = document.getElementById('page-loading');

  if (!isConfigured()) {
    loading.classList.add('hidden');
    openSettingsModal(true);
    return;
  }

  initTabs();

  try {
    const db = await loadDB();

    loading.classList.add('hidden');

    // Bought & Ready
    document.getElementById('panel-bought').innerHTML = renderPanel(
      db['to-read-bought'],
      'to-read-bought',
      'No books queued up yet.',
    );

    // Want to Read Someday
    document.getElementById('panel-someday').innerHTML = renderPanel(
      db['to-read-someday'],
      'to-read-someday',
      'Your someday list is empty.',
    );

    // Update count in page subtitle
    const total = db['to-read-bought'].length + db['to-read-someday'].length;
    document.getElementById('book-count').textContent =
      total === 0 ? '' : `${total} book${total === 1 ? '' : 's'}`;

    // Wire up empty-state add buttons
    document.querySelectorAll('.empty-add-btn').forEach(btn => {
      btn.addEventListener('click', () => openSearchModal(btn.dataset.list));
    });

    // Show first tab by default
    switchTab(TABS[0].id);

  } catch (err) {
    console.error(err);
    document.getElementById('page-loading').classList.add('hidden');
    showToast('Could not load your books. Check Settings.', 'error');
  }
}

init();
