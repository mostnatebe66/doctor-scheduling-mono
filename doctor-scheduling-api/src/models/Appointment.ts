import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    doctor_name: { type: String, required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
  },
  { timestamps: true },
);

AppointmentSchema.index({ doctor_name: 1, start_time: 1 });

export interface AppointmentDoc extends mongoose.Document {
  doctor_name: string;
  patient_id: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
}

export const Appointment = mongoose.model<AppointmentDoc>('Appointment', AppointmentSchema);
