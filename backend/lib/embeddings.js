// backend/lib/embeddings.js
// AI package recommendations — OpenAI embeddings + preference-vector helpers.
//
// Uses text-embedding-3-small (1536 dims). All functions fail SOFT: if the
// OpenAI key is missing or a call errors, they return null / [] so callers can
// fall back to the default (non-AI) experience without breaking.

const db = require('./db');

const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_DIMS  = 1536;

let _openai = null;
function getClient() {
  if (_openai) return _openai;
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const OpenAI = require('openai');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _openai;
  } catch (e) {
    console.error('[embeddings] openai package not available:', e.message);
    return null;
  }
}

// Is the feature usable at all right now?
function isEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

// ── Text composition ──────────────────────────────────────────────────
// Build the string we embed for a package. Uses only columns that exist
// (title, category, destination, duration, description). "tags" isn't a real
// column, so category + destination stand in as the structured signal.
function packageText(pkg) {
  const parts = [
    pkg.title,
    pkg.category ? `Category: ${String(pkg.category).replace(/_/g, ' ')}` : null,
    pkg.destination ? `Destination: ${pkg.destination}` : null,
    pkg.duration ? `Duration: ${pkg.duration}` : null,
    pkg.description,
  ].filter(Boolean);
  return parts.join('. ').slice(0, 8000); // stay well under token limits
}

// Build the preference text for an employee from quiz answers + booking history.
// quiz row shape: { adventure_types: text[], interests: jsonb, duration_preference, budget_preference }
// bookedPackages: array of { title, category, destination } from their past bookings.
function preferenceText(quiz, bookedPackages = []) {
  const parts = [];
  if (quiz) {
    if (Array.isArray(quiz.adventure_types) && quiz.adventure_types.length) {
      parts.push(`Interested in: ${quiz.adventure_types.map(t => String(t).replace(/_/g, ' ')).join(', ')}`);
    }
    // interests JSONB may hold { travel_type, travel_type_label, answers }
    let interests = quiz.interests;
    if (typeof interests === 'string') { try { interests = JSON.parse(interests); } catch { interests = null; } }
    if (interests) {
      if (interests.travel_type_label) parts.push(`Travel style: ${interests.travel_type_label}`);
      else if (interests.travel_type)  parts.push(`Travel style: ${interests.travel_type}`);
      if (interests.answers && typeof interests.answers === 'object') {
        const vals = Object.values(interests.answers).filter(v => typeof v === 'string');
        if (vals.length) parts.push(`Preferences: ${vals.join(', ')}`);
      }
    }
    if (quiz.duration_preference) parts.push(`Preferred trip length: ${quiz.duration_preference}`);
    if (quiz.budget_preference)   parts.push(`Budget: ${quiz.budget_preference}`);
  }
  if (bookedPackages.length) {
    const booked = bookedPackages
      .slice(0, 10)
      .map(b => [b.title, b.category, b.destination].filter(Boolean).join(' '))
      .filter(Boolean);
    if (booked.length) parts.push(`Previously booked: ${booked.join('; ')}`);
  }
  return parts.join('. ').slice(0, 8000);
}

// ── OpenAI calls ──────────────────────────────────────────────────────
// Embed a single string → number[] (or null on failure/disabled).
async function embedText(text) {
  const client = getClient();
  if (!client || !text || !text.trim()) return null;
  try {
    const resp = await client.embeddings.create({ model: EMBED_MODEL, input: text });
    return resp.data[0].embedding;
  } catch (e) {
    console.error('[embeddings] embedText failed:', e.message);
    return null;
  }
}

// Embed many strings at once → array of number[] aligned to input order.
// Returns null on failure so callers can fall back.
async function embedBatch(texts) {
  const client = getClient();
  if (!client || !texts.length) return null;
  try {
    const resp = await client.embeddings.create({ model: EMBED_MODEL, input: texts });
    // API preserves order and returns .index; sort defensively.
    return resp.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
  } catch (e) {
    console.error('[embeddings] embedBatch failed:', e.message);
    return null;
  }
}

// ── Storage ───────────────────────────────────────────────────────────
// pgvector accepts a string literal like '[0.1,0.2,...]'.
function toVectorLiteral(arr) {
  return '[' + arr.map(x => (Number.isFinite(x) ? x : 0)).join(',') + ']';
}

// Upsert one package's embedding. Returns true on success.
async function upsertPackageEmbedding(pkg) {
  const text = packageText(pkg);
  const vec = await embedText(text);
  if (!vec) return false;
  try {
    await db.query(
      `INSERT INTO package_embeddings (package_id, embedding, source_text, model, updated_at)
       VALUES ($1, $2::vector, $3, $4, NOW())
       ON CONFLICT (package_id) DO UPDATE SET
         embedding   = EXCLUDED.embedding,
         source_text = EXCLUDED.source_text,
         model       = EXCLUDED.model,
         updated_at  = NOW()`,
      [pkg.id, toVectorLiteral(vec), text, EMBED_MODEL]
    );
    return true;
  } catch (e) {
    console.error('[embeddings] upsert failed for', pkg.id, e.message);
    return false;
  }
}

// Fire-and-forget wrapper for use inside request handlers (never blocks/breaks the response).
function upsertPackageEmbeddingAsync(pkg) {
  if (!isEnabled()) return;
  // Load full package fields if only an id was passed
  Promise.resolve()
    .then(async () => {
      let full = pkg;
      if (!pkg.description || !pkg.title) {
        const r = await db.query('SELECT * FROM packages WHERE id=$1', [pkg.id]);
        if (!r.rows.length) return;
        full = r.rows[0];
      }
      await upsertPackageEmbedding(full);
    })
    .catch(e => console.error('[embeddings] async upsert error:', e.message));
}

module.exports = {
  EMBED_MODEL,
  EMBED_DIMS,
  isEnabled,
  packageText,
  preferenceText,
  embedText,
  embedBatch,
  toVectorLiteral,
  upsertPackageEmbedding,
  upsertPackageEmbeddingAsync,
};
