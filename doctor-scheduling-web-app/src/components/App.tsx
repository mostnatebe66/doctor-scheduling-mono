import React, { useEffect, useMemo, useState } from 'react';
import type { Appointment, Patient } from '../types';
import { timeSlotsForDay, fmtTime } from '../lib/time';
import AppointmentsList from './AppointmentsList';
import Card from './Card';
import BookModal from './BookModal';
import CreatePatientModal from './CreatePatientModal';
import {
  getPatients,
  getAppointments,
  createPatient,
  bookAppt,
  deleteAppt,
  reschedAppt,
} from '../lib/api';

const BREAKS = [{ start: '12:00', end: '12:30' }];
const DOCTORS = ['Dr.Smith', 'Dr.Adams', 'Dr.Lee', 'Dr.Khan'] as const;

function toHHmm(d: Date) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
function isInLunchBreak(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const mins = h * 60 + m;
  return BREAKS.some((b) => {
    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    return mins >= s && mins < e;
  });
}

export default function App() {
  const [doctor, setDoctor] = useState('Dr.Smith');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  useEffect(() => {
    getPatients().then(setPatients).catch(console.error);
  }, []);

  useEffect(() => {
    getAppointments(doctor, date).then(setAppointments).catch(console.error);
  }, [doctor, date]);

  const slots = useMemo(() => timeSlotsForDay(date), [date]);
  const takenTimes = useMemo(() => new Set(appointments.map((a) => a.start_time)), [appointments]);

  async function handleBookFromModal(payload: {
    doctor: string;
    patientId: string;
    isoStart: string;
  }) {
    await bookAppt(payload.patientId, payload.doctor, payload.isoStart);
    const next = await getAppointments(doctor, date);
    setAppointments(next);
    setIsModalOpen(false);
  }

  function startReschedule(a: Appointment) {
    setReschedulingId((prev) => (prev === a.id ? null : a.id));
  }

  async function handlePickSlot(iso: string) {
    if (reschedulingId) {
      await reschedAppt(reschedulingId, iso);
      setAppointments(await getAppointments(doctor, date));
      setReschedulingId(null);
      return;
    }
    setIsModalOpen(true);
  }

  async function handleCreatePatient(name: string) {
    await createPatient(name);
    const ps = await getPatients();
    setPatients(ps);
  }

  async function handleCancel(a: Appointment) {
    await deleteAppt(a.id);
    setAppointments(await getAppointments(doctor, date));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              Patient Scheduling
            </h1>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            >
              {DOCTORS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreatePatientOpen(true)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              + New Patient
            </button>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl bg-sky-500 px-4 py-2 text-white shadow hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            Book Appointment
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <Card title="Booked Appointments">
              <AppointmentsList
                appointments={appointments}
                onCancel={handleCancel}
                onReschedule={startReschedule}
                reschedulingId={reschedulingId}
              />
            </Card>
          </section>

          <section className="lg:col-span-1">
            <Card title="Open Appointments & Breaks">
              <div className="space-y-2">
                {slots.map((slot) => {
                  const hhmm = toHHmm(slot);
                  if (isInLunchBreak(hhmm)) {
                    return (
                      <div
                        key={hhmm}
                        className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 ring-1 ring-sky-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                          <span className="font-medium text-sky-700">Lunch Break</span>
                        </div>
                        <span className="tabular-nums text-sky-700">
                          {fmtTime(slot.toISOString())}
                        </span>
                      </div>
                    );
                  }
                  const iso = slot.toISOString();
                  const isFree = !takenTimes.has(iso);
                  if (!isFree) return null;
                  return (
                    <button
                      key={iso}
                      onClick={() => handlePickSlot(iso)}
                      className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      <span className="text-slate-700">{fmtTime(iso)}</span>
                      {reschedulingId ? (
                        <span className="text-xs text-slate-400">Move here</span>
                      ) : (
                        <span className="text-xs text-slate-400">Tap to book</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>
        </div>
      </main>

      <CreatePatientModal
        open={isCreatePatientOpen}
        onClose={() => setIsCreatePatientOpen(false)}
        onCreate={handleCreatePatient}
      />

      <BookModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={date}
        doctors={DOCTORS}
        patients={patients}
        takenTimes={takenTimes}
        onBook={handleBookFromModal}
      />
    </div>
  );
}
