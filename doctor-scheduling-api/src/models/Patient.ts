import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema(
  { name: { type: String, required: true } },
  { timestamps: true },
);

export interface PatientDoc extends mongoose.Document {
  name: string;
}

export const Patient = mongoose.model<PatientDoc>('Patient', PatientSchema);
