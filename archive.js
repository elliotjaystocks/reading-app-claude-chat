/**
 * archive.js — Archive page (tabs: Finished / Abandoned)
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
  openSearchModal('archive-finished');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  openSettingsModal(false);
});

// ----------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------

const TABS = [
  { id: 'archive-finished',  label: 'Finished',   panelId: 'panel-finished'  },
  { id: 'archive-abandoned', label: 'Abandoned',  panelId: 'panel-abandoned' },
];

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

    document.getElementById('panel-finished').innerHTML = renderPanel(
      db['archive-finished'],
      'archive-finished',
      'No finished books yet.',
    );

    document.getElementById('panel-abandoned').innerHTML = renderPanel(
      db['archive-abandoned'],
      'archive-abandoned',
      'Nothing abandoned — impressive.',
    );

    const total = db['archive-finished'].length + db['archive-abandoned'].length;
    document.getElementById('book-count').textContent =
      total === 0 ? '' : `${total} book${total === 1 ? '' : 's'}`;

    switchTab(TABS[0].id);

  } catch (err) {
    console.error(err);
    document.getElementById('page-loading').classList.add('hidden');
    showToast('Could not load your books. Check Settings.', 'error');
  }
}

init();
