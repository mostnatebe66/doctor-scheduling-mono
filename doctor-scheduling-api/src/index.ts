import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { patientRouter } from './routes/patients.js';
import { appointmentRouter } from './routes/appointments.js';

export const app = express();
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

app.use('/patients', patientRouter);
app.use('/appointments', appointmentRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pds_schedule';

export async function start() {
  await mongoose.connect(MONGO_URI);
  return app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  try {
    await start();
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}
