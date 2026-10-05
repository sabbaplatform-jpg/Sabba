// backend/scripts/backfill-embeddings.js
// One-off (re-runnable) script: generate embeddings for all live packages
// that don't yet have one (or use --all to re-embed everything).
//
// Usage (from backend/ directory, with env loaded):
//   node scripts/backfill-embeddings.js          # only packages missing an embedding
//   node scripts/backfill-embeddings.js --all    # re-embed every live package
//
// Requires: OPENAI_API_KEY and DATABASE_URL in the environment.

require('dotenv').config();
const db = require('../lib/db');
const { embedBatch, packageText, toVectorLiteral, EMBED_MODEL, isEnabled } = require('../lib/embeddings');

const BATCH = 50; // packages per OpenAI batch call

async function main() {
  if (!isEnabled()) {
    console.error('OPENAI_API_KEY not set — aborting.');
    process.exit(1);
  }
  const reembedAll = process.argv.includes('--all');

  const sql = reembedAll
    ? `SELECT p.* FROM packages p WHERE p.status = 'live' ORDER BY p.created_at`
    : `SELECT p.* FROM packages p
         LEFT JOIN package_embeddings e ON e.package_id = p.id
         WHERE p.status = 'live' AND e.package_id IS NULL
         ORDER BY p.created_at`;

  const { rows: pkgs } = await db.query(sql);
  console.log(`Found ${pkgs.length} package(s) to embed (${reembedAll ? 'all live' : 'missing only'}).`);
  if (!pkgs.length) { await db.end(); return; }

  let done = 0, failed = 0;
  for (let i = 0; i < pkgs.length; i += BATCH) {
    const chunk = pkgs.slice(i, i + BATCH);
    const texts = chunk.map(packageText);
    const vecs = await embedBatch(texts);
    if (!vecs) {
      console.error(`Batch ${i / BATCH + 1} failed — skipping.`);
      failed += chunk.length;
      continue;
    }
    // Store each result
    for (let j = 0; j < chunk.length; j++) {
      try {
        await db.query(
          `INSERT INTO package_embeddings (package_id, embedding, source_text, model, updated_at)
           VALUES ($1, $2::vector, $3, $4, NOW())
           ON CONFLICT (package_id) DO UPDATE SET
             embedding = EXCLUDED.embedding, source_text = EXCLUDED.source_text,
             model = EXCLUDED.model, updated_at = NOW()`,
          [chunk[j].id, toVectorLiteral(vecs[j]), texts[j], EMBED_MODEL]
        );
        done++;
      } catch (e) {
        console.error('  store failed for', chunk[j].id, e.message);
        failed++;
      }
    }
    console.log(`  progress: ${Math.min(i + BATCH, pkgs.length)}/${pkgs.length}`);
  }

  console.log(`\nDone. Embedded: ${done}, failed: ${failed}.`);
  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
