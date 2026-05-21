/**
 * state.js — Global database state
 *
 * Wraps github.js + db.js into simple async operations.
 * Uses sessionStorage as a within-session cache so navigating
 * between pages doesn't hammer the GitHub API.
 */

import { readFile, writeFile } from './github.js';
import {
  parseMarkdown,
  serializeMarkdown,
  createEmptyDB,
  createBook,
} from './db.js';

const SESSION_KEY = 'bookshelf_session';

let _db  = null;
let _sha = null;

// ----------------------------------------------------------------
// Internal cache helpers
// ----------------------------------------------------------------

function readCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ db: _db, sha: _sha }));
  } catch {
    // sessionStorage not available — not a problem, we'll just refetch
  }
}

function clearCache() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/** Return the current in-memory DB object. */
export function getDB() {
  return _db;
}

/**
 * Load the database from GitHub (or session cache).
 * Pass force = true to bypass the cache and re-fetch.
 */
export async function loadDB(force = false) {
  if (!force) {
    const cached = readCache();
    if (cached) {
      _db  = cached.db;
      _sha = cached.sha;
      return _db;
    }
  }

  const { content, sha } = await readFile();
  _sha = sha;
  _db  = content ? parseMarkdown(content) : createEmptyDB();
  writeCache();
  return _db;
}

/**
 * Serialise the in-memory DB and write it to GitHub.
 * Updates _sha with the new value returned by the API.
 */
export async function saveDB() {
  const content  = serializeMarkdown(_db);
  const result   = await writeFile(content, _sha);
  _sha           = result.content.sha;
  writeCache();
}

/**
 * First-run setup: validate credentials, then load or create books.md.
 * Called from the settings modal after the user saves their config.
 */
export async function initDB() {
  const { content, sha } = await readFile();
  _sha = sha;

  if (content === null) {
    // books.md doesn't exist yet — create it
    _db = createEmptyDB();
    await saveDB();
  } else {
    _db = parseMarkdown(content);
    writeCache();
  }

  return _db;
}

/** Bust the session cache (call after any write operation). */
export function bustCache() {
  clearCache();
}

// ----------------------------------------------------------------
// Mutation helpers
// ----------------------------------------------------------------

/**
 * Add a book (from an Open Library search result) to a list.
 * Saves to GitHub automatically.
 */
export async function addBook(bookData, listId) {
  if (!_db) throw new Error('Database not loaded');
  const book = createBook(bookData);
  _db[listId].push(book);
  await saveDB();
  return book;
}

/**
 * Remove a book from a list by its id.
 * Saves to GitHub automatically.
 */
export async function removeBook(bookId, listId) {
  if (!_db) throw new Error('Database not loaded');
  _db[listId] = _db[listId].filter(b => b.id !== bookId);
  await saveDB();
}

/**
 * Move a book from one list to another.
 * Saves to GitHub automatically.
 */
export async function moveBook(bookId, fromList, toList) {
  if (!_db) throw new Error('Database not loaded');

  const idx = _db[fromList].findIndex(b => b.id === bookId);
  if (idx === -1) throw new Error(`Book ${bookId} not found in ${fromList}`);

  const [book] = _db[fromList].splice(idx, 1);
  _db[toList].push(book);
  await saveDB();

  return book;
}

/**
 * Find a single book by id, searching all lists.
 * Returns { book, listId } or null.
 */
export function findBook(bookId) {
  if (!_db) return null;
  for (const [listId, books] of Object.entries(_db)) {
    const book = books.find(b => b.id === bookId);
    if (book) return { book, listId };
  }
  return null;
}
