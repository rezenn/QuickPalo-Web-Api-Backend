import mongoose, { Document, Schema } from "mongoose";
import { AppointmentType } from "../types/appointment.type";
import { required } from "zod/mini";

const appointmentMongoSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.Mixed, required: true },
    userId: { type: Schema.Types.Mixed, required: true },
    departmentId: { type: String, required: true },
    departmentName: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhoneNumber: { type: String, required: true },
    notes: { type: String, required: false },
    timeslot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      isAvailable: { type: Boolean, default: true },
    },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
      default: "pending",
    },
    paymentAmout: { type: Number, required: true, default: 0, min: 0 },
    PaymentMethod: {
      type: String,
      enum: ["online", "cash"],
      default: "online",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

appointmentMongoSchema.index({ organizationId: 1, date: 1 });
appointmentMongoSchema.index({ userId: 1 });
appointmentMongoSchema.index({ status: 1 });
appointmentMongoSchema.index({ date: 1 });

export interface IAppointment extends AppointmentType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const AppointmentModel = mongoose.model<IAppointment>(
  "Appointment",
  appointmentMongoSchema,
);
