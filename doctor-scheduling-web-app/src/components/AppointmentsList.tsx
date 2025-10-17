import React from 'react';
import type { Appointment } from '../types';
import { fmtTime } from '../lib/time';

type Props = Readonly<{
  appointments: Appointment[];
  onCancel: (a: Appointment) => void;
  onReschedule?: (a: Appointment) => void;
  reschedulingId?: string | null;
}>;

export default function AppointmentsList({
  appointments,
  onCancel,
  onReschedule,
  reschedulingId,
}: Props) {
  if (appointments.length === 0) {
    return <p className="text-sm text-gray-600">No appointments yet.</p>;
  }

  const time = fmtTime(appointments[0].start_time);

  console.log({ appointments, time });
  return (
    <ul className="space-y-2">
      {appointments.map((a) => {
        const isActive = reschedulingId === a.id;
        return (
          <li
            key={a.id}
            className={`flex items-center justify-between rounded-md border p-2 ${isActive ? 'border-sky-300 bg-sky-50' : 'border-gray-200'}`}
          >
            <div className="text-sm text-gray-800">
              <span className="font-medium">
                {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
              </span>
              <span className="ml-2 text-gray-600">
                {a.patient_name ?? `Patient #${a.patient_id}`}
              </span>
            </div>
            <div className="flex gap-2">
              {onReschedule && (
                <button
                  type="button"
                  className={`btn-outline ${isActive ? 'ring-2 ring-sky-300' : ''}`}
                  onClick={() => onReschedule(a)}
                >
                  {isActive ? 'Pick a new time…' : 'Reschedule'}
                </button>
              )}
              <button type="button" className="btn-outline" onClick={() => onCancel(a)}>
                Cancel
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
