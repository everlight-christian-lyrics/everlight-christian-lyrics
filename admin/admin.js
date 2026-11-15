
// ========================================
// EVERLIGHT CHRISTIAN LYRICS - ADMIN
// ========================================

const $ = s => document.querySelector(s);

const statusEl = $('#status');
const loginSection = $('#login-section');
const dashboard = $('#dashboard');
const editor = $('#editor');
const listPanel = $('#song-list-panel');
const songList = $('#song-list');
const form = $('#song-form');

let songs = [];
let isAuthenticated = false;

function status(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function showLoggedIn(on) {
  isAuthenticated = on;

  loginSection.hidden = on;
  dashboard.hidden = !on;
  listPanel.hidden = !on;

  if (!on) editor.hidden = true;
}

async function api(url, options = {}) {
  const r = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await r.json().catch(() => ({
    error: 'Unexpected server response'
  }));

  if (!r.ok) {
    throw Error(data.error || `Request failed (${r.status})`);
  }

  return data;
}

async function check() {
  showLoggedIn(false);
  status('Checking login session...');

  try {
    await api('/api/auth/me');

    showLoggedIn(true);
    status('Logged in. Manage your song catalogue below.');

    await loadSongs();
  } catch (err) {
    showLoggedIn(false);
    status('Please log in to manage songs.');
  }
}

// LOGIN
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();

  try {
    await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: $('#password').value
      })
    });

    $('#password').value = '';
    showLoggedIn(true);
    status('Login successful.');

    await loadSongs();
  } catch (err) {
    showLoggedIn(false);
    status(err.message);
  }
});

// LOGOUT
$('#logout').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', {
      method: 'POST',
      body: '{}'
    });
  } finally {
    showLoggedIn(false);
    songs = [];
    status('You are logged out.');
  }
});

// HTML ESCAPING
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// LOAD SONGS
async function loadSongs() {
  if (!isAuthenticated) return;

  try {
    const d = await api('/api/songs?all=1');
    songs = d.songs || [];

    songList.innerHTML = songs.length
      ? songs.map(s => `
        <div class="song-row">
          <div>
            <strong>${esc(s.title)}</strong>
            <small>
              ${esc(s.artist || 'Artist not set')} ·
              ${esc(s.category || 'General')} ·
              ${esc(s.status)} ·
              /lyrics/${esc(s.slug)}/
            </small>
          </div>
          <div>
            <button class="admin-btn secondary"
              data-edit="${esc(s.id)}">Edit</button>

            <button class="admin-btn secondary"
              data-toggle="${esc(s.id)}">
              ${s.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>

            <button class="admin-btn danger"
              data-delete="${esc(s.id)}">Delete</button>
          </div>
        </div>
      `).join('')
      : '<p>No songs yet. Add your first song.</p>';

    songList.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () =>
        editSong(songs.find(s => s.id === b.dataset.edit));
    });

    songList.querySelectorAll('[data-toggle]').forEach(b => {
      b.onclick = () =>
        toggleSong(songs.find(s => s.id === b.dataset.toggle));
    });

    songList.querySelectorAll('[data-delete]').forEach(b => {
      b.onclick = () =>
        deleteSong(songs.find(s => s.id === b.dataset.delete));
    });

  } catch (e) {
    status(e.message);
  }
}

// RESET FORM
function resetForm() {
  form.reset();

  $('#song-id').value = '';
  $('#editor-heading').textContent = 'Add a song';
  $('#publish').value = 'draft';
  $('#category').value = 'General';

  $('#rightsConfirmed').checked = false;
  $('#rightsConfirmed').required = true;

  editor.hidden = true;
}

// NEW SONG
$('#new-song').onclick = () => {
  if (!isAuthenticated) return;

  resetForm();
  editor.hidden = false;
  editor.scrollIntoView({ behavior: 'smooth' });
};

$('#cancel-edit').onclick = resetForm;

// AUTOMATIC SLUG
$('#title').addEventListener('input', () => {
  if (!$('#song-id').value) {
    $('#slug').value = $('#title').value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

// EDIT SONG
function editSong(s) {
  if (!s || !isAuthenticated) return;

  $('#song-id').value = s.id;

  for (const k of [
    'title',
    'artist',
    'language',
    'slug',
    'description',
    'lyrics',
    'englishTranslation',
    'transliteration',
    'youtubeUrl',
    'spotifyUrl'
  ]) {
    $('#' + k).value = s[k] || '';
  }

  $('#category').value = s.category || 'General';
  $('#searchTerms').value = (s.searchTerms || []).join(', ');
  $('#publish').value = s.status;

  $('#rightsConfirmed').checked = true;
  $('#rightsConfirmed').required = false;

  $('#editor-heading').textContent = 'Edit song';
  editor.hidden = false;
  editor.scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// SAVE SONG
// ========================================

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!isAuthenticated) return;

  const id = $('#song-id').value;

  const body = {
    title: $('#title').value.trim(),
    artist: $('#artist').value.trim(),
    language: $('#language').value,
    category: $('#category').value,
    slug: $('#slug').value.trim(),
    description: $('#description').value.trim(),
    lyrics: $('#lyrics').value,
    englishTranslation: $('#englishTranslation').value,
    transliteration: $('#transliteration').value,
    youtubeUrl: $('#youtubeUrl').value.trim(),
    spotifyUrl: $('#spotifyUrl').value.trim(),
    searchTerms: $('#searchTerms').value
      .split(',')
      .map(x => x.trim())
      .filter(Boolean),
    status: $('#publish').value,
    rightsConfirmed: $('#rightsConfirmed').checked
  };

  try {
    const d = await api(
      id ? `/api/songs/${encodeURIComponent(id)}` : '/api/songs',
      {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      }
    );

    status(
      `Saved “${d.song.title}”. ${
        d.song.status === 'published'
          ? 'Public page: ' + location.origin +
            '/lyrics/' + d.song.slug + '/'
          : 'Saved as draft; it is not publicly visible.'
      }`
    );

    resetForm();
    await loadSongs();

  } catch (err) {
    status(err.message);
  }
});

// ========================================
// PUBLISH / UNPUBLISH SONG
// ========================================

async function toggleSong(s) {
  if (!s || !isAuthenticated) return;

  try {
    await api('/api/songs/' + encodeURIComponent(s.id), {
      method: 'PUT',
      body: JSON.stringify({
        ...s,
        status: s.status === 'published' ? 'draft' : 'published',
        rightsConfirmed: true
      })
    });

    status('Song status updated.');
    await loadSongs();

  } catch (e) {
    status(e.message);
  }
}

// ========================================
// DELETE SONG
// ========================================

async function deleteSong(s) {
  if (!s || !isAuthenticated) return;

  if (!confirm(`Permanently delete “${s.title}”?`)) return;

  try {
    await api('/api/songs/' + encodeURIComponent(s.id), {
      method: 'DELETE'
    });

    status('Song deleted.');
    await loadSongs();

  } catch (e) {
    status(e.message);
  }
}

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

  if (quoted) throw Error('CSV has an unclosed quoted field.');

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
  const number = String(item.source_sno || '0')
    .trim()
    .padStart(2, '0');

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

if (csvImportButton && csvFileInput &&
    csvRightsCheckbox && csvImportStatus) {

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
      status('Please confirm the rights or legal basis for importing.');
      return;
    }

    if (!/\.csv$/i.test(file.name)) {
      status('Please select a CSV file.');
      return;
    }

    csvImportButton.disabled = true;
    csvImportStatus.hidden = false;
    csvImportStatus.textContent = 'Reading CSV file...';

    try {
      const entries = parseCSV(await file.text());

      if (!entries.length) {
        throw Error('No song entries found.');
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

      // Refresh songs before duplicate checking.
      const existingData = await api('/api/songs?all=1');
      songs = existingData.songs || [];

      const existingSlugs = new Set(
        songs.map(song => song.slug)
      );

      const allowedCategories = [
        'General',
        'Telugu Christmas Songs',
        'Telugu Worship Songs',
        'Telugu Praise Songs',
        'Telugu Easter Songs'
      ];

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        const title = (item.title_telugu || '').trim();

        if (!title) {
          errors.push(`Row ${i + 2}: Missing title.`);
          continue;
        }

        const category = (item.proposed_category || '').trim();

        if (!allowedCategories.includes(category)) {
          errors.push(`Row ${i + 2}: Invalid category.`);
          continue;
        }

        const slug = makeImportSlug(item);

        if (existingSlugs.has(slug)) {
          skipped++;
          continue;
        }

        const body = {
          title,
          artist: '',
          language: (item.language || '').trim() || 'Telugu',
          category,
          slug,
          description: '',
          lyrics: item.lyrics_telugu || '',
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
          existingSlugs.add(slug);

        } catch (err) {
          errors.push(`${title}: ${err.message}`);
        }

        csvImportStatus.textContent =
          `Importing ${i + 1} of ${entries.length} songs...\n` +
          `Imported: ${imported}\n` +
          `Skipped: ${skipped}\n` +
          `Errors: ${errors.length}`;
      }

      csvImportStatus.textContent =
        `IMPORT COMPLETE\n\n` +
        `Total entries: ${entries.length}\n` +
        `Successfully imported: ${imported}\n` +
        `Skipped duplicates: ${skipped}\n` +
        `Failed entries: ${errors.length}\n\n` +
        (errors.length
          ? 'Errors:\n' + errors.join('\n')
          : 'All songs processed successfully.');

      status('CSV import completed.');
      await loadSongs();

    } catch (err) {
      csvImportStatus.textContent =
        'Import failed: ' + err.message;
      status(err.message);

    } finally {
      csvImportButton.disabled = false;
    }
  });
}

// ========================================
// START ADMIN SESSION CHECK
// ========================================

check();
