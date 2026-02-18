import z from "zod";
import { AppointmentSchema } from "../types/appointment.type";

export const CreateAppointmentDto = AppointmentSchema.omit({
  userId: true,
  status: true,
  paymentStatus: true,
}).extend({
  userId: z.string().optional(),
});

export type AppointmentType = z.infer<typeof AppointmentSchema>;
export type CreateAppointmentDtoType = z.infer<typeof CreateAppointmentDto>;
