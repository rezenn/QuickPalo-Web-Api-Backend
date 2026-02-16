import z from "zod";

export const TimeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});
export const AppointmentSchema = z.object({
  clientName: z.string().min(2),
  organizationName: z.string().min(2),
  department: z.string(),
  timeslot: z.string(),
  date: z.date,
  note: z.string().optional(),
});

export type AppointmentType = z.infer<typeof AppointmentSchema>;
