import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/index';
import { Patient } from '../../src/models/Patient';
import { Appointment } from '../../src/models/Appointment';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Appointment.deleteMany({});
  await Patient.deleteMany({});
});

describe('Appointments E2E', () => {
  it('creates a patient and books a valid appointment', async () => {
    const p = await request(app).post('/patients').send({ name: 'Test User' }).expect(201);
    const patient_id = p.body.id as string;
    const start = new Date('2025-01-01T15:00:00.000Z').toISOString();

    const create = await request(app)
      .post('/appointments')
      .send({ patient_id, doctor_name: 'Dr.Who', start_time: start })
      .expect(201);

    expect(create.body.doctor_name).toBe('Dr.Who');

    const list = await request(app)
      .get('/appointments')
      .query({ doctor_name: 'Dr.Who', date: '2025-01-01' })
      .expect(200);

    expect(list.body.length).toBe(1);
    expect(list.body[0].patient_id).toBe(patient_id);
  });

  it('rejects overlapping appointments for same doctor', async () => {
    const p = await request(app).post('/patients').send({ name: 'Overlap User' }).expect(201);
    const pid = p.body.id as string;
    const start = new Date('2025-01-01T16:00:00.000Z').toISOString();

    await request(app)
      .post('/appointments')
      .send({ patient_id: pid, doctor_name: 'Dr.X', start_time: start })
      .expect(201);
    await request(app)
      .post('/appointments')
      .send({ patient_id: pid, doctor_name: 'Dr.X', start_time: start })
      .expect(409);
  });

  it('enforces quarter-hour rule and hours window', async () => {
    const p = await request(app).post('/patients').send({ name: 'Rules User' }).expect(201);
    const pid = p.body.id as string;
    await request(app)
      .post('/appointments')
      .send({ patient_id: pid, doctor_name: 'Dr.Z', start_time: '2025-01-09T15:07:00.000Z' })
      .expect(400);
    await request(app)
      .post('/appointments')
      .send({ patient_id: pid, doctor_name: 'Dr.Z', start_time: '2025-01-09T00:00:00.000Z' })
      .expect(400);
  });
});
