const test = require('node:test');
const assert = require('node:assert/strict');

const { createMemoryMongoUri, stopMemoryMongo } = require('../config/db');

test('database config can create a local in-memory MongoDB URI', async () => {
  const mongoUri = await createMemoryMongoUri();
  assert.match(mongoUri, /^mongodb:\/\/127\.0\.0\.1:/);

  await stopMemoryMongo();
});
