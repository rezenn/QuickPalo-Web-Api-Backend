import z from "zod";
import { UserSchema } from "../types/user.type";

export const CreateOrganizationDto = UserSchema.pick({
  fullname: true,
  email: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password do not match",
  path: ["confirmPassword"],
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationDto>;
