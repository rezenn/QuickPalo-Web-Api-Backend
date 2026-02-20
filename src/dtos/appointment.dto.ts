import z from "zod";
import {
  AppointmentSchema,
  AppointmentStatusSchema,
} from "../types/appointment.type";

export const CreateAppointmentDto = AppointmentSchema.omit({
  userId: true,
  status: true,
  paymentStatus: true,
}).extend({
  userId: z.string().optional(),
});

export type AppointmentType = z.infer<typeof AppointmentSchema>;
export type CreateAppointmentDtoType = z.infer<typeof CreateAppointmentDto>;

export const UpdateAppointmentStatusDto = z.object({
  status: AppointmentStatusSchema,
});

export type UpdateAppointmentStatusDtoType = z.infer<
  typeof UpdateAppointmentStatusDto
>;

export const AppointmentQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: AppointmentStatusSchema.optional(),
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export type AppointmentQueryDtoType = z.infer<typeof AppointmentQueryDto>;
