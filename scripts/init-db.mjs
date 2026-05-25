#!/usr/bin/env node
// Backward-compatible entrypoint for local bootstrap.
// Delegates to the versioned migration runner so init and prod stay aligned.

await import('./migrate-db.mjs');
