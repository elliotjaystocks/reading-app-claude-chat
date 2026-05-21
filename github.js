/**
 * github.js — GitHub Contents API integration
 *
 * Reads and writes books.md in the user's repository.
 * Config (username, repo name, PAT) is stored in localStorage.
 */

const CONFIG_KEY = 'bookshelf_github_config';
const FILE_PATH  = 'books.md';

// ----------------------------------------------------------------
// Config management
// ----------------------------------------------------------------

export function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  if (config === null) {
    localStorage.removeItem(CONFIG_KEY);
  } else {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

export function isConfigured() {
  const c = getConfig();
  return !!(c?.username && c?.repo && c?.token);
}

// ----------------------------------------------------------------
// Encoding helpers (handles UTF-8 book titles / author names)
// ----------------------------------------------------------------

function encodeContent(str) {
  const bytes  = new TextEncoder().encode(str);
  const binary = Array.from(bytes, b => String.fromCodePoint(b)).join('');
  return btoa(binary);
}

function decodeContent(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes  = Uint8Array.from(binary, c => c.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

// ----------------------------------------------------------------
// Core API request
// ----------------------------------------------------------------

async function apiRequest(path, method = 'GET', body = null) {
  const config = getConfig();
  if (!config) throw new Error('GitHub is not configured.');

  const url = `https://api.github.com/repos/${config.username}/${config.repo}/contents/${path}`;

  const headers = {
    'Authorization':        `Bearer ${config.token}`,
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const options = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${response.status}`);
  }

  return response.json();
}

// ----------------------------------------------------------------
// Public file operations
// ----------------------------------------------------------------

/**
 * Read books.md from the repo.
 * Returns { content: string|null, sha: string|null }
 */
export async function readFile() {
  try {
    const data    = await apiRequest(FILE_PATH);
    const content = decodeContent(data.content);
    return { content, sha: data.sha };
  } catch (err) {
    // File doesn't exist yet — that's fine on first run
    if (err.message.includes('Not Found') || err.message.includes('404')) {
      return { content: null, sha: null };
    }
    throw err;
  }
}

/**
 * Write books.md to the repo.
 * Pass sha when updating an existing file (required by GitHub API).
 * Returns the response object (contains new sha at result.content.sha).
 */
export async function writeFile(content, sha = null) {
  const body = {
    message: `Update bookshelf — ${new Date().toISOString().slice(0, 10)}`,
    content: encodeContent(content),
  };
  if (sha) body.sha = sha;

  return apiRequest(FILE_PATH, 'PUT', body);
}

/**
 * Validate credentials by fetching the repo metadata.
 * Throws if the token or repo is wrong.
 */
export async function validateConfig() {
  const config = getConfig();
  if (!config) throw new Error('No config saved.');

  const url      = `https://api.github.com/repos/${config.username}/${config.repo}`;
  const response = await fetch(url, {
    headers: {
      'Authorization':        `Bearer ${config.token}`,
      'Accept':               'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Could not reach repository (${response.status})`);
  }

  return response.json();
}
