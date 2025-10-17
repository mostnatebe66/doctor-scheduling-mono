import { Router } from 'express';
import { Patient } from '../models/Patient.js';

export const patientRouter = Router();

patientRouter.post('/', async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required (string)' });
    }
    const p = await Patient.create({ name });
    return res.status(201).json({ id: String((p as any)._id), name: p.name });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

patientRouter.get('/', async (_req, res) => {
  const pts = await Patient.find().sort({ createdAt: -1 }).lean();
  return res.json(pts.map((p: any) => ({ id: String(p._id), name: p.name })));
});
