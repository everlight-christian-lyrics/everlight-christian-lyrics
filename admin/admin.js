
// ========================================
// CSV BULK IMPORTER
// ========================================

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  text = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === '') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }

  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) throw Error('CSV file is empty.');

  const headers = rows.shift().map(h => h.trim());

  return rows
    .filter(r => r.some(v => v.trim() !== ''))
    .map(r => {
      const item = {};
      headers.forEach((h, i) => {
        item[h] = r[i] || '';
      });
      return item;
    });
}

function makeImportSlug(item) {
  const number = String(item.source_sno || '0').padStart(2, '0');

  const firstLine = (item.romanized_lyrics || '')
    .split(/\r?\n/)
    .find(line => line.trim()) || '';

  const readable = firstLine
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 65);

  return `collection-${number}${readable ? '-' + readable : ''}`;
}

const csvImportButton = $('#csv-import-btn');
const csvFileInput = $('#csv-file');
const csvRightsCheckbox = $('#csv-rights-confirmed');
const csvImportStatus = $('#csv-import-status');

if (csvImportButton) {
  csvImportButton.addEventListener('click', async () => {
    if (!isAuthenticated) {
      status('Please log in before importing songs.');
      return;
    }

    const file = csvFileInput.files[0];

    if (!file) {
      status('Please select a CSV file first.');
      return;
    }

    if (!csvRightsCheckbox.checked) {
      status('Please confirm the rights or legal basis for importing these lyrics.');
      return;
    }

    csvImportButton.disabled = true;
    csvImportStatus.hidden = false;
    csvImportStatus.textContent = 'Reading CSV file...';

    try {
      const text = await file.text();
      const entries = parseCSV(text);

      if (!entries.length) {
        throw Error('No song entries found in CSV.');
      }

      const requiredHeaders = [
        'source_sno',
        'title_telugu',
        'lyrics_telugu',
        'romanized_lyrics',
        'language',
        'proposed_category'
      ];

      const headers = Object.keys(entries[0]);

      const missing = requiredHeaders.filter(
        h => !headers.includes(h)
      );

      if (missing.length) {
        throw Error('Missing CSV columns: ' + missing.join(', '));
      }

      let imported = 0;
      const errors = [];

      for (let i = 0; i < entries.length; i++) {
        const item = entries[i];

        const title = item.title_telugu.trim();

        if (!title) {
          errors.push(`Row ${i + 2}: Missing song title.`);
          continue;
        }

        const category = item.proposed_category.trim();

        const allowedCategories = [
          'General',
          'Telugu Christmas Songs',
          'Telugu Worship Songs',
          'Telugu Praise Songs',
          'Telugu Easter Songs'
        ];

        if (!allowedCategories.includes(category)) {
          errors.push(`Row ${i + 2}: Invalid category.`);
          continue;
        }

        const body = {
          title,
          artist: '',
          language: item.language.trim() || 'Telugu',
          category,
          slug: makeImportSlug(item),
          description: '',
          lyrics: item.lyrics_telugu,
          englishTranslation: item.english_translation || '',
          transliteration: item.romanized_lyrics || '',
          youtubeUrl: '',
          spotifyUrl: '',
          searchTerms: [],
          status: 'draft',
          rightsConfirmed: true
        };

        try {
          await api('/api/songs', {
            method: 'POST',
            body: JSON.stringify(body)
          });

          imported++;

        } catch (err) {
          errors.push(`${title}: ${err.message}`);
        }

        csvImportStatus.textContent =
          `Importing ${i + 1} of ${entries.length} songs...\n` +
          `Successfully imported: ${imported}\n` +
          `Errors: ${errors.length}`;
      }

      csvImportStatus.textContent =
        `IMPORT COMPLETE\n\n` +
        `Total entries: ${entries.length}\n` +
        `Successfully imported: ${imported}\n` +
        `Failed entries: ${errors.length}\n\n` +
        (errors.length
          ? 'Errors:\n' + errors.join('\n')
          : 'All songs saved successfully as drafts.');

      status('CSV import completed.');

      await loadSongs();

    } catch (err) {
      csvImportStatus.textContent = 'Import failed: ' + err.message;
      status(err.message);

    } finally {
      csvImportButton.disabled = false;
    }
  });
}
