import mongoose from 'mongoose';
import process from 'node:process';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pds_schedule';
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  if (NODE_ENV === 'production') {
    throw new Error('Cannot clear data in production!');
  }

  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // wait up to 30s for Mongo
  });

  // ping to confirm mongo connectivity
  await mongoose.connection.db.admin().command({ ping: 1 });
  console.log('✅ Connected. Clearing data...');

  // deletes patients & appointments
  await Promise.all([
    mongoose.connection.collection('patients').deleteMany({}),
    mongoose.connection.collection('appointments').deleteMany({}),
  ]);

  console.log('✅ Cleared patients & appointments.');
}

main()
  .catch((err) => {
    console.error('❌ Failed to clear data:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });
