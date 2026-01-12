import { connectTestDatabase, clearDatabase } from './helpers/database.helper.js';

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});
