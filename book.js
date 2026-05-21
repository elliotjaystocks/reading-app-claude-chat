/**
 * book.js — Book detail page
 *
 * URL params: ?id={bookId}&list={listId}
 */

import { isConfigured }                                from './github.js';
import { loadDB, moveBook, removeBook }                from './state.js';
import {
  openSettingsModal,
  openSearchModal,
  showToast,
  escapeHtml,
  ICON_SEARCH_NAV,
  ICON_SETTINGS_NAV,
  ICON_ARROW_LEFT_NAV,
} from './ui.js';
import { LISTS }                                       from './db.js';

// Inject nav icons
document.getElementById('btn-search').innerHTML   = ICON_SEARCH_NAV;
document.getElementById('btn-settings').innerHTML = ICON_SETTINGS_NAV;

document.getElementById('btn-search').addEventListener('click', () => {
  openSearchModal('currently-reading');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  openSettingsModal(false);
});

// ----------------------------------------------------------------
// Parse URL params
// ----------------------------------------------------------------

const params  = new URLSearchParams(location.search);
const bookId  = params.get('id');
const listId  = params.get('list');

if (!bookId || !listId) {
  location.replace('index.html');
}

// Map listId → page URL for the back link
const LIST_PAGE = {
  'currently-reading': 'index.html',
  'to-read-bought':    'to-read.html',
  'to-read-someday':   'to-read.html',
  'archive-finished':  'archive.html',
  'archive-abandoned': 'archive.html',
};

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
    const db   = await loadDB();
    const list = db[listId];
    if (!list) { location.replace('index.html'); return; }

    const book = list.find(b => b.id === bookId);
    if (!book) {
      showToast('Book not found.', 'error');
      loading.classList.add('hidden');
      setTimeout(() => location.replace(LIST_PAGE[listId] || 'index.html'), 1500);
      return;
    }

    loading.classList.add('hidden');
    renderPage(book, listId);

  } catch (err) {
    console.error(err);
    document.getElementById('page-loading').classList.add('hidden');
    showToast('Could not load book details.', 'error');
  }
}

function renderPage(book, currentList) {
  document.title = `${book.title} — Bookshelf`;

  const backPage = LIST_PAGE[currentList] || 'index.html';
  const backLabel = LISTS[currentList] || 'Back';

  // Build list options excluding the current one
  const moveOptions = Object.entries(LISTS)
    .filter(([id]) => id !== currentList)
    .map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`)
    .join('');

  document.getElementById('book-detail-content').innerHTML = `
    <a href="${backPage}" class="back-link">
      ${ICON_ARROW_LEFT_NAV} ${escapeHtml(backLabel)}
    </a>

    <div class="book-detail">
      <div class="book-detail-cover">
        ${book.cover
          ? `<img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)} cover">`
          : `<div class="book-detail-placeholder"><span>${escapeHtml(book.title)}</span></div>`
        }
      </div>

      <div class="book-detail-info">
        <span class="book-detail-list-badge">${escapeHtml(LISTS[currentList] || currentList)}</span>
        <h1 class="book-detail-title">${escapeHtml(book.title)}</h1>
        <p class="book-detail-author">${escapeHtml(book.author)}</p>
        ${book.isbn ? `<p class="book-detail-isbn">ISBN ${escapeHtml(book.isbn)}</p>` : ''}

        <div class="book-actions-group">
          <label for="move-select">Move to a different shelf</label>
          <select id="move-select" aria-label="Choose a shelf">
            ${moveOptions}
          </select>
          <br>
          <button class="btn btn-secondary" id="btn-move">Move book</button>
        </div>

        <hr class="book-detail-divider">

        <button class="btn btn-danger" id="btn-remove">Remove from shelf</button>
      </div>
    </div>
  `;

  // Move
  document.getElementById('btn-move').addEventListener('click', async () => {
    const targetList = document.getElementById('move-select').value;
    const btn = document.getElementById('btn-move');
    btn.disabled    = true;
    btn.textContent = 'Moving…';

    try {
      await moveBook(bookId, currentList, targetList);
      showToast(`Moved to ${LISTS[targetList]}.`, 'success');
      setTimeout(() => location.replace(LIST_PAGE[targetList] || 'index.html'), 500);
    } catch (err) {
      console.error(err);
      btn.disabled    = false;
      btn.textContent = 'Move book';
      showToast('Move failed. Please try again.', 'error');
    }
  });

  // Remove
  document.getElementById('btn-remove').addEventListener('click', async () => {
    if (!confirm(`Remove "${book.title}" from your shelf? This cannot be undone.`)) return;

    const btn = document.getElementById('btn-remove');
    btn.disabled    = true;
    btn.textContent = 'Removing…';

    try {
      await removeBook(bookId, currentList);
      showToast('Book removed.', 'default');
      setTimeout(() => location.replace(backPage), 400);
    } catch (err) {
      console.error(err);
      btn.disabled    = false;
      btn.textContent = 'Remove from shelf';
      showToast('Remove failed. Please try again.', 'error');
    }
  });
}

init();
