import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;
let connected = false;

async function ensureMemoryServer(): Promise<void> {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    connected = true;
  } else if (!connected) {
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    connected = true;
  }
}

export async function resetDb(): Promise<void> {
  await ensureMemoryServer();
  const collections = mongoose.connection.collections;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

export async function endDb(): Promise<void> {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
