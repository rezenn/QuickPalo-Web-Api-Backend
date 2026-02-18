import z from "zod";

export const AppointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const TimeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean().default(true),
});

export const AppointmentSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  departmentId: z.string(),
  departmentName: z.string(),
  clientName: z.string(),
  clientEmail: z.email(),
  clientPhoneNumber: z.string(),
  notes: z.string().optional(),
  timeslot: TimeSlotSchema,
  date: z
    .string()
    .or(z.date())
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Date cannot be in the past",
    }),
  status: AppointmentStatusSchema.default("pending"),
  paymentAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["online", "cash"]).default("online"),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).default("pending"),
});

export type AppointmentType = z.infer<typeof AppointmentSchema>;
