/**
 * ui.js — Shared UI components
 *
 * Exports:
 *   showToast(message, type)
 *   openSearchModal(defaultList)
 *   openSettingsModal(isRequired)
 *   renderBookCard(book, listId)
 *   renderBookRow(book, listId)
 *   escapeHtml(str)
 */

import { searchBooks }                 from './openlibrary.js';
import { isConfigured, saveConfig,
         getConfig, validateConfig }   from './github.js';
import { addBook, initDB }             from './state.js';
import { LISTS }                       from './db.js';

// ============================================================
// SVG icon strings
// ============================================================

const ICON_X = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

const ICON_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

const ICON_ARROW_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7M5 12h14"/></svg>`;

const ICON_CHEVRON = `<svg class="book-row-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

const ICON_CHEVRON_MD = `<svg class="search-result-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

export const ICON_SEARCH_NAV = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

export const ICON_SETTINGS_NAV = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

export const ICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>`;

export const ICON_BOOK_OPEN = `<svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;

export const ICON_ARROW_LEFT_NAV = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7M5 12h14"/></svg>`;

// ============================================================
// Utility
// ============================================================

export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// Toast notifications
// ============================================================

export function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ============================================================
// Modal management
// ============================================================

let _activeOverlay = null;

function getModalRoot() {
  return document.getElementById('modal-root');
}

export function closeModal() {
  if (!_activeOverlay) return;
  _activeOverlay.classList.remove('open');
  const overlay = _activeOverlay;
  _activeOverlay = null;
  setTimeout(() => overlay.remove(), 200);
}

function createOverlay(closeable = true) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  if (closeable) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function onKeydown(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKeydown); }
    });
  }

  getModalRoot().appendChild(overlay);
  _activeOverlay = overlay;

  // Allow browser to paint before triggering the transition
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('open')));

  return overlay;
}

// ============================================================
// Search modal
// ============================================================

export function openSearchModal(defaultList = 'currently-reading') {
  const overlay = createOverlay(true);

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">Find a book</h2>
        <button class="modal-close" aria-label="Close modal">${ICON_X}</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
      <div class="modal-footer" id="modal-footer"></div>
    </div>
  `;

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);

  _showSearchView(overlay, defaultList);
}

function _showSearchView(overlay, defaultList) {
  overlay.querySelector('#modal-title').textContent = 'Find a book';

  overlay.querySelector('#modal-body').innerHTML = `
    <div class="search-input-wrap">
      ${ICON_SEARCH}
      <input
        type="search"
        id="search-query"
        class="search-input"
        placeholder="Title, author, or ISBN…"
        autocomplete="off"
        autofocus
        aria-label="Search for books"
      >
    </div>
    <div id="search-results" class="search-results">
      <p class="search-status">Start typing to search the Open Library catalogue…</p>
    </div>
  `;

  overlay.querySelector('#modal-footer').innerHTML = '';

  const input   = overlay.querySelector('#search-query');
  const results = overlay.querySelector('#search-results');

  let debounce = null;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();

    if (q.length < 2) {
      results.innerHTML = '<p class="search-status">Start typing to search the Open Library catalogue…</p>';
      return;
    }

    results.innerHTML = '<div class="search-status"><div class="spinner"></div></div>';

    debounce = setTimeout(async () => {
      try {
        const books = await searchBooks(q);
        if (!books.length) {
          results.innerHTML = '<p class="search-status">No results found. Try a different search.</p>';
          return;
        }
        results.innerHTML = books.map((b, i) => `
          <div class="search-result" role="button" tabindex="0" data-index="${i}">
            <div class="search-result-cover">
              ${b.cover ? `<img src="${escapeHtml(b.cover)}" alt="" loading="lazy">` : ''}
            </div>
            <div class="search-result-info">
              <p class="search-result-title">${escapeHtml(b.title)}</p>
              <p class="search-result-meta">${escapeHtml(b.author)}${b.year ? ` · ${b.year}` : ''}</p>
            </div>
            ${ICON_CHEVRON_MD}
          </div>
        `).join('');

        results.querySelectorAll('.search-result').forEach(el => {
          const selectResult = () => {
            const idx = parseInt(el.dataset.index, 10);
            _showPreviewView(overlay, books[idx], defaultList);
          };
          el.addEventListener('click', selectResult);
          el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectResult(); });
        });

      } catch (err) {
        results.innerHTML = '<p class="search-status">Search failed. Check your connection and try again.</p>';
        console.error(err);
      }
    }, 420);
  });

  // Focus input on next frame so animation doesn't fight it
  requestAnimationFrame(() => input.focus());
}

function _showPreviewView(overlay, bookData, defaultList) {
  overlay.querySelector('#modal-title').textContent = 'Add to your shelf';

  overlay.querySelector('#modal-body').innerHTML = `
    <div class="preview-book">
      <div class="preview-cover">
        ${bookData.cover
          ? `<img src="${escapeHtml(bookData.cover)}" alt="">`
          : `<div class="preview-cover-placeholder"><span>${escapeHtml(bookData.title)}</span></div>`
        }
      </div>
      <div class="preview-info">
        <p class="preview-title">${escapeHtml(bookData.title)}</p>
        <p class="preview-author">${escapeHtml(bookData.author)}</p>
      </div>
    </div>
    <p class="list-options-label">Add to…</p>
    <div id="list-options">
      ${Object.entries(LISTS).map(([id, name]) => `
        <label class="list-option">
          <input type="radio" name="target-list" value="${id}" ${id === defaultList ? 'checked' : ''}>
          <span class="list-option-name">${escapeHtml(name)}</span>
        </label>
      `).join('')}
    </div>
  `;

  overlay.querySelector('#modal-footer').innerHTML = `
    <button class="btn btn-ghost" id="btn-back">${ICON_ARROW_LEFT} Back to results</button>
    <span style="flex:1"></span>
    <button class="btn btn-primary" id="btn-add-confirm">Add book</button>
  `;

  overlay.querySelector('#btn-back').addEventListener('click', () => _showSearchView(overlay, defaultList));

  overlay.querySelector('#btn-add-confirm').addEventListener('click', async () => {
    const selected = overlay.querySelector('input[name="target-list"]:checked');
    if (!selected) return;

    const btn = overlay.querySelector('#btn-add-confirm');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      await addBook(bookData, selected.value);
      closeModal();
      showToast('Book added to your shelf.', 'success');
      // Give the toast a moment before refreshing
      setTimeout(() => location.reload(), 400);
    } catch (err) {
      btn.disabled    = false;
      btn.textContent = 'Add book';
      showToast('Could not save. Check your settings.', 'error');
      console.error(err);
    }
  });
}

// ============================================================
// Settings modal
// ============================================================

export function openSettingsModal(isRequired = false) {
  const overlay = createOverlay(!isRequired);
  const config  = getConfig() || {};

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Connect to GitHub</h2>
        ${!isRequired ? `<button class="modal-close" aria-label="Close">${ICON_X}</button>` : ''}
      </div>
      <div class="modal-body">
        <p class="settings-intro">
          Bookshelf saves your reading list to a <code>books.md</code> file in a GitHub
          repository of your choice. You'll need a personal access token so the app
          can read and write that file on your behalf.
          <br><br>
          <strong>To create a token:</strong> go to
          <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer">
            GitHub → Settings → Developer settings → Fine-grained tokens
          </a>,
          click <em>Generate new token</em>, select your bookshelf repo under
          <em>Repository access</em>, and grant
          <strong>Contents → Read and write</strong> permission.
        </p>

        <div class="field">
          <label for="cfg-username">GitHub username</label>
          <input type="text" id="cfg-username" value="${escapeHtml(config.username || '')}"
                 placeholder="your-username" autocomplete="off" spellcheck="false">
        </div>

        <div class="field">
          <label for="cfg-repo">Repository name</label>
          <input type="text" id="cfg-repo" value="${escapeHtml(config.repo || '')}"
                 placeholder="bookshelf" autocomplete="off" spellcheck="false">
          <p class="field-note">The repository where <code>books.md</code> will live.</p>
        </div>

        <div class="field">
          <label for="cfg-token">Personal access token</label>
          <input type="password" id="cfg-token" value="${escapeHtml(config.token || '')}"
                 placeholder="github_pat_…" autocomplete="off" spellcheck="false">
          <p class="field-note">
            Stored only in your browser's local storage. Never shared with anyone.
          </p>
        </div>

        <div id="settings-feedback"></div>
      </div>
      <div class="modal-footer">
        ${!isRequired ? '<button class="btn btn-secondary" id="btn-settings-cancel">Cancel</button>' : ''}
        <button class="btn btn-primary" id="btn-settings-save">Save &amp; connect</button>
      </div>
    </div>
  `;

  if (!isRequired) {
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.querySelector('#btn-settings-cancel').addEventListener('click', closeModal);
  }

  overlay.querySelector('#btn-settings-save').addEventListener('click', async () => {
    const username = overlay.querySelector('#cfg-username').value.trim();
    const repo     = overlay.querySelector('#cfg-repo').value.trim();
    const token    = overlay.querySelector('#cfg-token').value.trim();
    const feedback = overlay.querySelector('#settings-feedback');

    if (!username || !repo || !token) {
      feedback.innerHTML = '<p class="settings-error">Please fill in all three fields.</p>';
      return;
    }

    const btn = overlay.querySelector('#btn-settings-save');
    btn.disabled    = true;
    btn.textContent = 'Connecting…';
    feedback.innerHTML = '';

    try {
      saveConfig({ username, repo, token });

      // Validate credentials and create books.md if it doesn't exist
      await validateConfig();
      await initDB();

      closeModal();
      showToast('Connected! Loading your books…', 'success');
      setTimeout(() => location.reload(), 500);

    } catch (err) {
      saveConfig(null);
      btn.disabled    = false;
      btn.textContent = 'Save & connect';
      feedback.innerHTML = `<p class="settings-error">${escapeHtml(err.message)}<br>
        Please check your username, repository name, and token, then try again.</p>`;
    }
  });
}

// ============================================================
// Book card  (Currently Reading grid)
// ============================================================

export function renderBookCard(book, listId) {
  const href = `book.html?id=${encodeURIComponent(book.id)}&list=${encodeURIComponent(listId)}`;
  return `
    <a href="${href}" class="book-card">
      <div class="book-card-cover" aria-hidden="true">
        ${book.cover
          ? `<img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)} cover" loading="lazy">`
          : `<div class="book-card-placeholder"><span>${escapeHtml(book.title)}</span></div>`
        }
      </div>
      <div class="book-card-body">
        <p class="book-card-title">${escapeHtml(book.title)}</p>
        <p class="book-card-author">${escapeHtml(book.author)}</p>
      </div>
    </a>
  `;
}

// ============================================================
// Book row  (To Read / Archive lists)
// ============================================================

export function renderBookRow(book, listId) {
  const href = `book.html?id=${encodeURIComponent(book.id)}&list=${encodeURIComponent(listId)}`;
  return `
    <a href="${href}" class="book-row">
      <div class="book-row-cover" aria-hidden="true">
        ${book.cover
          ? `<img src="${escapeHtml(book.cover)}" alt="" loading="lazy">`
          : '<div class="book-row-placeholder"></div>'
        }
      </div>
      <div class="book-row-info">
        <p class="book-row-title">${escapeHtml(book.title)}</p>
        <p class="book-row-author">${escapeHtml(book.author)}</p>
      </div>
      ${ICON_CHEVRON}
    </a>
  `;
}
