import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { Patient } from '../types';
import { timeSlotsForDay, fmtTime } from '../lib/time';
import { getAppointments } from '../lib/api';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  date: string;
  doctors: readonly string[];
  patients: readonly Patient[];
  takenTimes: ReadonlySet<string>;
  onBook: (p: { doctor: string; patientId: string; isoStart: string }) => void;
}>;

type BreakWindow = Readonly<{ start: string; end: string }>;
const BREAKS: ReadonlyArray<BreakWindow> = [{ start: '12:00', end: '12:30' }] as const;

function toHHmm(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
function isInBreak(hhmm: string): boolean {
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

export default function BookModal({
  open,
  onClose,
  date,
  doctors,
  patients,
  takenTimes,
  onBook,
}: Props) {
  const [doctor, setDoctor] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [isoStart, setIsoStart] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(date);
  const [loading, setLoading] = useState(false);
  const [localTakenTimes, setLocalTakenTimes] = useState<ReadonlySet<string>>(takenTimes);

  useEffect(() => {
    if (open) {
      setDoctor('');
      setPatientId('');
      setIsoStart('');
      setSelectedDate(date);
      setLocalTakenTimes(takenTimes);
    }
  }, [open, date, takenTimes]);

  useEffect(() => {
    if (doctor && !doctors.includes(doctor)) setDoctor('');
  }, [doctors, doctor]);
  useEffect(() => {
    if (patientId && !patients.some((p) => p.id === patientId)) setPatientId('');
  }, [patients, patientId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!doctor || !selectedDate) {
        return;
      }
      setLoading(true);
      try {
        const appts = await getAppointments(doctor, selectedDate);
        if (!cancelled) {
          setLocalTakenTimes(new Set(appts.map((a) => a.start_time)));
        }
      } catch {
        if (!cancelled) {
          setLocalTakenTimes(takenTimes);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [doctor, selectedDate, takenTimes]);

  const allSlots = useMemo(() => timeSlotsForDay(selectedDate), [selectedDate]);

  const available = useMemo(() => {
    return allSlots
      .filter((d) => !isInBreak(toHHmm(d)))
      .map((d) => {
        const iso = d.toISOString();
        return { iso, label: fmtTime(iso) };
      })
      .filter((s) => !localTakenTimes.has(s.iso));
  }, [allSlots, localTakenTimes]);

  const patientNameById = useMemo(() => {
    const m = new Map<string, string>();
    patients.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [patients]);

  const onOverlayClick = useCallback(() => onClose(), [onClose]);

  const canSubmit = Boolean(doctor && patientId && isoStart);

  const missingHints = [
    !doctor && 'Select Doctor',
    !patientId && 'Select Patient',
    !isoStart && 'Select Time',
  ]
    .filter(Boolean)
    .join(' • ');

  if (!open) return null;

  let timePlaceholder: string;

  if (!doctor) {
    timePlaceholder = 'Select a doctor first';
  } else if (loading) {
    timePlaceholder = 'Loading…';
  } else {
    timePlaceholder = 'Select time';
  }

  const titleId = 'book-modal-title';
  const timeId = 'book-modal-time';
  const doctorId = 'book-modal-doctor';
  const patientFieldId = 'book-modal-patient';
  const dateFieldId = 'book-modal-date';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/35"
        role="presentation"
        aria-hidden="true"
        onClick={onOverlayClick}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-semibold text-slate-800">
            Book Appointment
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (doctor && patientId && isoStart) {
              onBook({ doctor, patientId, isoStart });
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={dateFieldId} className="block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id={dateFieldId}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
            <div>
              <label htmlFor={doctorId} className="block text-sm font-medium text-slate-700">
                Doctor
              </label>
              <select
                id={doctorId}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option value="" disabled>
                  Select Doctor
                </option>
                {doctors.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={patientFieldId} className="block text-sm font-medium text-slate-700">
                Patient
              </label>
              <select
                id={patientFieldId}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="" disabled>
                  Select Patient
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={timeId} className="block text-sm font-medium text-slate-700">
                Time
              </label>
              <select
                id={timeId}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
                value={isoStart}
                onChange={(e) => setIsoStart(e.target.value)}
                disabled={!doctor || loading}
              >
                <option value="" disabled>
                  {timePlaceholder}
                </option>
                {available.map((s) => (
                  <option key={s.iso} value={s.iso}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section
            aria-labelledby="available-times-title"
            className="rounded-xl border border-slate-200"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <h4 id="available-times-title" className="text-sm font-semibold text-slate-800">
                Available appointments
              </h4>
              <span className="text-xs text-slate-500">{available.length}</span>
            </div>

            <div className="max-h-64 overflow-auto">
              {(() => {
                if (!doctor) {
                  return (
                    <p className="p-3 text-sm text-slate-500">Select a doctor to see times.</p>
                  );
                }

                if (loading) {
                  return <p className="p-3 text-sm text-slate-500">Loading…</p>;
                }

                if (available.length === 0) {
                  return <p className="p-3 text-sm text-slate-500">No open times for this day.</p>;
                }
                return (
                  <ul className="divide-y">
                    {available.map((s) => {
                      const selected = isoStart === s.iso;
                      const showPatient = selected && !!patientId;
                      const name = showPatient ? (patientNameById.get(patientId) ?? '') : '';

                      return (
                        <li key={s.iso}>
                          <button
                            type="button"
                            onClick={() => setIsoStart(s.iso)}
                            className={[
                              'w-full text-left px-3 py-2 focus:outline-none',
                              'hover:bg-slate-50',
                              selected
                                ? 'bg-sky-50 ring-1 ring-sky-200 text-sky-800'
                                : 'bg-white text-slate-800',
                            ].join(' ')}
                            aria-pressed={selected}
                          >
                            <span className="tabular-nums">{s.label}</span>

                            {selected && (
                              <span className="ml-2 text-xs text-sky-600">Selected</span>
                            )}

                            {showPatient && (
                              <span className="ml-2 text-xs text-slate-500">— {name}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          </section>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <span className="relative inline-block group">
              <button
                type={canSubmit ? 'submit' : 'button'}
                aria-disabled={!canSubmit}
                onClick={!canSubmit ? (e) => e.preventDefault() : undefined}
                className={[
                  'rounded-xl px-4 py-2 font-medium text-white shadow focus:outline-none focus:ring-4',
                  canSubmit
                    ? 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-200'
                    : 'bg-slate-400 cursor-not-allowed focus:ring-slate-200',
                ].join(' ')}
                title={!canSubmit ? missingHints : undefined} // native tooltip fallback
              >
                Book
              </button>

              {!canSubmit && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {missingHints}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 h-2 w-2 rotate-45 bg-slate-900" />
                </div>
              )}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
