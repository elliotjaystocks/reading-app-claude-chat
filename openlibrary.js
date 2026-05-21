/**
 * openlibrary.js — Open Library search API
 *
 * Docs: https://openlibrary.org/developers/api
 *
 * Cover images are served from covers.openlibrary.org.
 * We store the cover URL directly in books.md, so no caching
 * or local storage of images is needed.
 */

const SEARCH_URL = 'https://openlibrary.org/search.json';
const COVERS_URL = 'https://covers.openlibrary.org/b';

/**
 * Build a cover image URL from an Open Library cover ID.
 * Sizes: S, M, L
 */
export function coverFromId(coverId, size = 'M') {
  if (!coverId) return null;
  return `${COVERS_URL}/id/${coverId}-${size}.jpg`;
}

/**
 * Build a cover image URL from an ISBN.
 * Falls back gracefully if the book has no cover.
 */
export function coverFromIsbn(isbn, size = 'M') {
  if (!isbn) return null;
  return `${COVERS_URL}/isbn/${isbn}-${size}.jpg`;
}

/**
 * Search for books by any query (title, author, ISBN, or combination).
 * Returns an array of normalised book objects.
 */
export async function searchBooks(query) {
  const params = new URLSearchParams({
    q:      query.trim(),
    fields: 'key,title,author_name,isbn,cover_i,first_publish_year',
    limit:  '20',
  });

  const response = await fetch(`${SEARCH_URL}?${params}`);
  if (!response.ok) throw new Error(`Open Library search failed (${response.status})`);

  const data = await response.json();

  return (data.docs || []).map(doc => {
    const isbn = (doc.isbn || [])[0] || '';

    // Prefer cover_i (more reliable), fall back to ISBN-based URL
    let cover = null;
    if (doc.cover_i) {
      cover = coverFromId(doc.cover_i);
    } else if (isbn) {
      cover = coverFromIsbn(isbn);
    }

    return {
      title:  doc.title || 'Unknown Title',
      author: (doc.author_name || [])[0] || 'Unknown Author',
      isbn,
      cover,
      year:   doc.first_publish_year || '',
    };
  });
}
