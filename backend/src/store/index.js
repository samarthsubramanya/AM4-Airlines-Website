import { createMemoryStore } from './memory.js';
import { createMongoStore } from './mongo.js';

export async function createStore(env = process.env) {
  if (env.MONGODB_URI) return createMongoStore(env.MONGODB_URI, env.MONGODB_DB || 'indiancom');
  return createMemoryStore();
}
