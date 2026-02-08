import z from "zod";
import { UserSchema } from "../types/user.type";
import { OrganizationSchema } from "../types/organization.type";

export const CreateOrganizationDto = UserSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password do not match",
  path: ["confirmPassword"],
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationDto>;

export const CreateOrganizationDetailsDto = OrganizationSchema.pick({
  organizationName: true,
  organizationType: true,
  description: true,
  street: true,
  city: true,
  state: true,
  contactEmail: true,
  contactPhone: true,
  workingHours: true,
  departments: true,
  appointmentDuration: true,
  advanceBookingDays: true,
  timeSlots: true,
});

export type CreateOrganizationDetailsDto = z.infer<
  typeof CreateOrganizationDetailsDto
>;

export const UpdateOrganizationDetailsDto = OrganizationSchema.partial();
export type UpdateOrganizationDetailsDto = z.infer<
  typeof UpdateOrganizationDetailsDto
>;
