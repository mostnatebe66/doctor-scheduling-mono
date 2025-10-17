export type Patient = {
  id: string;
  name: string;
};

export type Appointment = {
  id: string;
  doctor_name: string;
  patient_id: string;
  patient_name?: string;
  start_time: string;
  end_time: string;
};
