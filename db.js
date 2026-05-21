/**
 * db.js — Markdown database parser & serializer
 *
 * books.md format:
 *
 *   # Bookshelf
 *
 *   ## currently-reading
 *
 *   ### The Name of the Wind
 *   - id: 1705123456789
 *   - author: Patrick Rothfuss
 *   - cover: https://covers.openlibrary.org/b/isbn/9780756404741-M.jpg
 *   - isbn: 9780756404741
 *
 *   ## to-read-bought
 *   ...
 */

export const LISTS = {
  'currently-reading': 'Currently Reading',
  'to-read-bought':    'Bought & Ready to Read',
  'to-read-someday':   'Want to Read Someday',
  'archive-finished':  'Finished',
  'archive-abandoned': 'Abandoned',
};

export const LIST_SECTIONS = {
  home:    ['currently-reading'],
  toread:  ['to-read-bought', 'to-read-someday'],
  archive: ['archive-finished', 'archive-abandoned'],
};

export function createEmptyDB() {
  return Object.fromEntries(Object.keys(LISTS).map(k => [k, []]));
}

export function parseMarkdown(md) {
  const db = createEmptyDB();
  if (!md || !md.trim()) return db;

  // Split on "## " section headers
  const parts = md.split(/^## /m);

  for (const part of parts.slice(1)) {
    const lines   = part.split('\n');
    const section = lines[0].trim();
    if (!Object.hasOwn(db, section)) continue;

    const body      = lines.slice(1).join('\n');
    const bookParts = body.split(/^### /m).slice(1);

    for (const bookPart of bookParts) {
      const bookLines = bookPart.split('\n');
      const title     = bookLines[0].trim();
      if (!title) continue;

      const book = { title };
      for (const line of bookLines.slice(1)) {
        const match = line.match(/^- (\w+): (.+)$/);
        if (match) book[match[1]] = match[2].trim();
      }
      db[section].push(book);
    }
  }

  return db;
}

export function serializeMarkdown(db) {
  let md = '# Bookshelf\n';

  for (const [section, books] of Object.entries(db)) {
    md += `\n## ${section}\n`;
    for (const book of books) {
      md += `\n### ${book.title}\n`;
      md += `- id: ${book.id}\n`;
      md += `- author: ${book.author || 'Unknown'}\n`;
      if (book.cover) md += `- cover: ${book.cover}\n`;
      if (book.isbn)  md += `- isbn: ${book.isbn}\n`;
    }
  }

  return md + '\n';
}

export function createBook(data) {
  return {
    id:     String(Date.now()),
    title:  (data.title  || 'Unknown Title').trim(),
    author: (data.author || 'Unknown Author').trim(),
    cover:  data.cover || '',
    isbn:   data.isbn  || '',
  };
}
