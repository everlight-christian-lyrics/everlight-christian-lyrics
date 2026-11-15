
import { json, requireAuth, validUrl } from '../_lib/auth.js';

const categories = [
  'General',
  'Telugu Christmas Songs',
  'Telugu Worship Songs',
  'Telugu Praise Songs',
  'Telugu Easter Songs'
];

const fields = `
  id,title,slug,artist,language,description,lyrics,
  english_translation,transliteration,youtube_url,
  spotify_url,search_terms,status,category,created_at,updated_at
`;

function row(r) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    artist: r.artist,
    language: r.language,
    description: r.description,
    lyrics: r.lyrics,
    englishTranslation: r.english_translation || '',
    transliteration: r.transliteration,
    youtubeUrl: r.youtube_url,
    spotifyUrl: r.spotify_url,
    searchTerms: JSON.parse(r.search_terms || '[]'),
    status: r.status,
    category: r.category || 'General',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function validate(b) {
  if (!b || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 180)
    return 'Song title is required (max 180 characters).';

  if (
    typeof b.slug !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.slug) ||
    b.slug.length > 180
  )
    return 'Use a URL slug with lowercase letters, numbers and hyphens.';

  for (const k of [
    'artist',
    'description',
    'lyrics',
    'englishTranslation',
    'transliteration'
  ]) {
    if (typeof (b[k] ?? '') !== 'string') return `Invalid ${k}.`;
  }

  if (
    (b.lyrics || '').length > 60000 ||
    (b.englishTranslation || '').length > 60000 ||
    (b.transliteration || '').length > 60000
  )
    return 'Lyrics or translation field is too long.';

  if (!['Telugu', 'English', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Other'].includes(b.language || 'Telugu'))
    return 'Choose a supported language.';

  if (!categories.includes(b.category || 'General'))
    return 'Choose a supported song category.';

  if (!['draft', 'published'].includes(b.status || 'draft'))
    return 'Invalid status.';

  if (!validUrl(b.youtubeUrl) || !validUrl(b.spotifyUrl))
    return 'Links must be valid HTTPS URLs.';

  if ((b.lyrics || '').trim() && b.rightsConfirmed !== true)
    return 'Confirm that you have the rights or valid legal basis to publish these lyrics.';

  return null;
}

function values(b) {
  return [
    b.title.trim(),
    b.slug,
    b.artist || '',
    b.language || 'Telugu',
    b.description || '',
    b.lyrics || '',
    b.englishTranslation || '',
    b.transliteration || '',
    b.youtubeUrl || '',
    b.spotifyUrl || '',
    JSON.stringify(
      Array.isArray(b.searchTerms)
        ? b.searchTerms.filter(x => typeof x === 'string').slice(0, 40)
        : []
    ),
    b.status || 'draft',
    b.category || 'General',
    new Date().toISOString()
  ];
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const all = url.searchParams.get('all') === '1';
  const category = url.searchParams.get('category');

  if (all) {
    const e = await requireAuth(request, env);
    if (e) return e;
  }

  if (category && !categories.includes(category)) {
    return json({ error: 'Invalid song category.' }, 400);
  }

  let query;

  if (all && category) {
    query = env.DB.prepare(
      `SELECT ${fields} FROM songs WHERE category=? ORDER BY updated_at DESC`
    ).bind(category);
  } else if (all) {
    query = env.DB.prepare(
      `SELECT ${fields} FROM songs ORDER BY updated_at DESC`
    );
  } else if (category) {
    query = env.DB.prepare(
      `SELECT ${fields} FROM songs WHERE status='published' AND category=? ORDER BY updated_at DESC`
    ).bind(category);
  } else {
    query = env.DB.prepare(
      `SELECT ${fields} FROM songs WHERE status='published' ORDER BY updated_at DESC`
    );
  }

  try {
    const { results = [] } = await query.all();
    return json({ songs: results.map(row) });
  } catch (error) {
    return json({ error: 'Could not load songs.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const e = await requireAuth(request, env);
  if (e) return e;

  let b;

  try {
    b = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const err = validate(b);
  if (err) return json({ error: err }, 400);

  const v = values(b);
  const id = crypto.randomUUID();

  try {
    await env.DB.prepare(`
      INSERT INTO songs (
        id,title,slug,artist,language,description,lyrics,
        english_translation,transliteration,youtube_url,
        spotify_url,search_terms,status,category,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(id, ...v).run();

  } catch (error) {
    return json({
      error: String(error).includes('UNIQUE')
        ? 'That URL slug is already used. Choose another slug.'
        : 'Could not save song. Check the database setup.'
    }, 500);
  }

  return json({
    song: {
      id,
      title: v[0],
      slug: v[1],
      status: v[11],
      category: v[12]
    }
  });
}
