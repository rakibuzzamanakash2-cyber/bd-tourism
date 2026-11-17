// Fixed values so tests never depend on a developer's .env, and never touch
// a real database or payment gateway. src/lib/env.ts validates these at
// import time, so they have to be set before any module under test loads.
// NODE_ENV is read-only in the Node types; vitest already sets it to "test".
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.AUTH_SECRET ??= "test-auth-secret-not-used-for-anything-real";
process.env.DATA_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
process.env.NEXT_PUBLIC_BDT_PER_USD ??= "120";
process.env.NEXT_PUBLIC_APP_URL ??= "https://deltaway.test";
