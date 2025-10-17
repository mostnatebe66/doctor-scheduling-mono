import React from 'react';
import type { Appointment } from '../types';
import { fmtTime } from '../lib/time';

type Props = {
  readonly slots: readonly Date[];
  readonly appointments: Appointment[];
  readonly onBook: (slot: Date) => void;
  readonly onReschedule: (appt: Appointment, slot: Date) => void;
};

function findAppt(appointments: Appointment[], slot: Date) {
  const t = slot.getTime();
  console.log({ t });
  return appointments.find((a) => new Date(a.start_time).getTime() === t);
}

export default function TimeSlots({ slots, appointments, onBook, onReschedule }: Props) {
  return (
    <ul className="divide-y divide-gray-200">
      {slots.map((slot) => {
        const appt = findAppt(appointments, slot);
        return (
          <li
            key={slot.toISOString()}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 transition"
          >
            <div className="w-20 tabular-nums text-sm text-gray-600">
              {fmtTime(slot.toISOString())}
            </div>

            {appt ? (
              <>
                <div className="flex-1 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Booked
                  </span>
                  <span className="ml-2 text-gray-700">
                    {appt.patient_name ? `(${appt.patient_name})` : `(patient #${appt.patient_id})`}
                  </span>
                </div>
                <button
                  className="btn-outline"
                  title="Move this appointment to this slot"
                  onClick={() => onReschedule(appt, slot)}
                >
                  Reschedule Here
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => onBook(slot)}>
                Book
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
