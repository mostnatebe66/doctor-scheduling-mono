import mongoose from 'mongoose';
import { Patient, type PatientDoc } from './models/Patient.js';
import { Appointment } from './models/Appointment.js';
import { addMinutes } from './utils/time.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pds_schedule';

const DOCTORS = ['Dr.Smith', 'Dr.Adams', 'Dr.Lee', 'Dr.Khan'];
const START_HOUR = 14; // 9AM America/Chicago == 14:00 UTC (during CDT)
const SLOT_MINUTES = 15;
const TOTAL_SLOTS = 32;
const BOOKING_DENSITY = 0.6;

function getCentralTime(d: Date): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(d);
  let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  if (hour === 24) {
    hour = 0;
  }
  return { hour, minute };
}

function createDaySlots(): Date[] {
  const base = new Date();
  const startLocal = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    START_HOUR,
    0,
    0,
    0,
  );
  const utcStart = new Date(startLocal.getTime() + startLocal.getTimezoneOffset() * 60_000);

  const allSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const utc = new Date(utcStart.getTime() + i * SLOT_MINUTES * 60_000);
    return utc;
  });

  //Filter out 12:00PM–12:30PM in Chicago time for lunch break
  return allSlots.filter((slot) => {
    const { hour, minute } = getCentralTime(slot);
    const totalMinutes = hour * 60 + minute;
    return totalMinutes < 720 || totalMinutes >= 750;
  });
}

function pickBookedSubset(slots: Date[], density = BOOKING_DENSITY): Date[] {
  const p = Math.min(1, Math.max(0, density));
  const chosen = slots.filter(() => Math.random() < p);

  if (chosen.length === 0 && slots.length > 0) {
    chosen.push(slots[Math.floor(Math.random() * slots.length)]);
  }
  return chosen;
}

async function createAppointmentsForDoctor(
  doctor: string,
  patients: PatientDoc[],
  baseSlots: Date[],
): Promise<void> {
  const bookedSlots = pickBookedSubset(baseSlots, BOOKING_DENSITY);

  const appointments = bookedSlots.map((start, i) => {
    const end = addMinutes(start, SLOT_MINUTES);
    const patient = patients[(i * 5) % patients.length];
    return {
      doctor_name: doctor,
      patient_id: patient._id,
      start_time: start.toISOString(), // ✅ UTC ISO
      end_time: end.toISOString(),
    };
  });

  if (appointments.length > 0) {
    await Appointment.insertMany(appointments);
  }
}

async function seedPatients(): Promise<PatientDoc[]> {
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Carlos Diaz',
    'Diana Prince',
    'Evelyn Brown',
    'Frank Miller',
    'Grace Lee',
    'Henry Adams',
    'Isabella Rossi',
    'Jack Wilson',
    'Karen Nguyen',
    "Liam O'Connor",
    'Mia Chen',
    'Noah Patel',
    'Olivia Martinez',
    'Paul Garcia',
    'Quinn Baker',
    'Ruby Thompson',
    'Samuel Clark',
    'Tara Singh',
    'Uma Kapoor',
    'Victor Hugo',
  ];
  return Patient.insertMany(names.map((name) => ({ name })));
}

async function run(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Seeding database...');

    await Promise.all([Appointment.deleteMany({}), Patient.deleteMany({})]);

    const patients = await seedPatients();
    const slots = createDaySlots();

    for (const doctor of DOCTORS) {
      await createAppointmentsForDoctor(doctor, patients, slots);
    }

    console.log('✅ Seed complete (UTC timestamps, no 12–12:30PM CST slots).');
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
