/**
 * index.js — Currently Reading page
 */

import { isConfigured }                                    from './github.js';
import { loadDB }                                          from './state.js';
import {
  openSearchModal,
  openSettingsModal,
  renderBookCard,
  showToast,
  ICON_BOOK_OPEN,
  ICON_PLUS,
  ICON_SEARCH_NAV,
  ICON_SETTINGS_NAV,
} from './ui.js';

// Inject nav icons (HTML is static; icons are dynamic strings)
document.getElementById('btn-search').innerHTML   = ICON_SEARCH_NAV;
document.getElementById('btn-settings').innerHTML = ICON_SETTINGS_NAV;

document.getElementById('btn-search').addEventListener('click', () => {
  openSearchModal('currently-reading');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  openSettingsModal(false);
});

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

  try {
    const db    = await loadDB();
    const books = db['currently-reading'];

    const grid    = document.getElementById('book-grid');
    const empty   = document.getElementById('empty-state');
    const count   = document.getElementById('book-count');
    const addBtn  = document.getElementById('btn-add');

    loading.classList.add('hidden');

    if (books.length === 0) {
      grid.hidden  = true;
      empty.hidden = false;
      empty.innerHTML = `
        ${ICON_BOOK_OPEN}
        <p>Nothing here yet. Add the book you're reading now.</p>
        <button class="btn btn-primary" id="btn-add-empty">${ICON_PLUS} Add a book</button>
      `;
      document.getElementById('btn-add-empty').addEventListener('click', () => {
        openSearchModal('currently-reading');
      });
    } else {
      const plural = books.length === 1 ? '1 book' : `${books.length} books`;
      count.textContent = plural;
      grid.innerHTML    = books.map(b => renderBookCard(b, 'currently-reading')).join('');
    }

    addBtn.addEventListener('click', () => openSearchModal('currently-reading'));

  } catch (err) {
    console.error(err);
    document.getElementById('page-loading').classList.add('hidden');
    showToast('Could not load your books. Check Settings.', 'error');
  }
}

init();
