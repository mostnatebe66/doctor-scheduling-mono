import type { Appointment, Patient } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_URL}/patients`);
  return res.json();
}

export async function getAppointments(doctor: string, date: string): Promise<Appointment[]> {
  const url = new URL(`${API_URL}/appointments`);
  url.searchParams.set('doctor_name', doctor);
  url.searchParams.set('date', date);
  const res = await fetch(url.toString());
  return res.json();
}

export async function createPatient(name: string) {
  return fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function bookAppt(patient_id: string, doctor_name: string, start_time: string) {
  return fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id, doctor_name, start_time }),
  });
}

export async function deleteAppt(id: string) {
  return fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
}

export async function reschedAppt(id: string, start_time: string) {
  return fetch(`${API_URL}/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_time }),
  });
}
