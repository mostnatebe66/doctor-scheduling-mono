import { Router } from 'express';
import { Appointment } from '../models/Appointment.js';
import { Patient } from '../models/Patient.js';
import { addMinutes, isQuarterHour, withinWorkingHours } from '../utils/time.js';

export const appointmentRouter = Router();

function toDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

appointmentRouter.get('/', async (req, res) => {
  try {
    const { doctor_name, date } = req.query as { doctor_name?: string; date?: string };
    if (!doctor_name || !date) {
      return res.status(400).json({ error: 'doctor_name and date are required' });
    }
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const appts = await Appointment.find({
      doctor_name,
      start_time: { $gte: dayStart, $lte: dayEnd },
    })
      .sort({ start_time: 1 })
      .populate('patient_id', 'name')
      .lean();

    return res.json(
      appts.map((a: any) => ({
        id: a._id.toString(),
        doctor_name: a.doctor_name,
        patient_id: (a.patient_id?._id ?? a.patient_id).toString(),
        patient_name: a.patient_id?.name ?? undefined,
        start_time: a.start_time,
        end_time: a.end_time,
      })),
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

appointmentRouter.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_name, start_time } = req.body ?? {};
    if (!patient_id || !doctor_name || !start_time) {
      return res.status(400).json({ error: 'patient_id, doctor_name, start_time are required' });
    }
    const patient = await Patient.findById(patient_id).lean();
    if (!patient) {
      return res.status(400).json({ error: 'invalid patient_id' });
    }

    const start = toDate(start_time);
    if (!isQuarterHour(start)) {
      return res.status(400).json({ error: 'start_time must be on a quarter hour' });
    }
    if (!withinWorkingHours(start)) {
      return res.status(400).json({ error: 'outside working hours (09:00-17:00)' });
    }
    const end = addMinutes(start, 15);

    const conflict = await Appointment.findOne({
      doctor_name,
      start_time: { $lt: end },
      end_time: { $gt: start },
    }).lean();
    if (conflict) {
      return res.status(409).json({ error: 'time slot already taken' });
    }

    const created = await Appointment.create({
      doctor_name,
      patient_id,
      start_time: start,
      end_time: end,
    });
    return res.status(201).json({
      id: String((created as any)._id),
      doctor_name,
      patient_id,
      start_time: created.start_time,
      end_time: created.end_time,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

appointmentRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body ?? {};
    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).json({ error: 'not_found' });
    }

    const doctor_name = (patch.doctor_name ?? appt.doctor_name) as string;
    const patient_id = patch.patient_id ?? appt.patient_id;

    let start = new Date(appt.start_time);
    let end = new Date(appt.end_time);

    if (patch.start_time) {
      start = new Date(patch.start_time);
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ error: 'Invalid start_time' });
      }
      if (!isQuarterHour(start))
        return res.status(400).json({ error: 'start_time must be on a quarter hour' });
      if (!withinWorkingHours(start))
        return res.status(400).json({ error: 'outside working hours (09:00-17:00)' });
      end = addMinutes(start, 15);
    }

    const conflict = await Appointment.findOne({
      _id: { $ne: appt._id },
      doctor_name,
      start_time: { $lt: end },
      end_time: { $gt: start },
    }).lean();
    if (conflict) return res.status(409).json({ error: 'time slot already taken' });

    appt.doctor_name = doctor_name;
    appt.patient_id = patient_id;
    appt.start_time = start;
    appt.end_time = end;
    await appt.save();

    return res.json({
      id: String((appt as any)._id),
      doctor_name: appt.doctor_name,
      patient_id: appt.patient_id.toString(),
      start_time: appt.start_time,
      end_time: appt.end_time,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

appointmentRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Appointment.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'not_found' });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});
