import z from "zod";
import { UserSchema } from "../types/user.type";

export const RegisterUserDto = UserSchema.pick({
  fullname: true,
  email: true,
  password: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password do not match",
  path: ["confirmPassword"],
});

export type RegisterUserDto = z.infer<typeof RegisterUserDto>;

export const LoginUserDto = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;

export const UpdateUserDto = UserSchema.pick({
  fullname: true,
  email: true,
}).partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

export const CreateAdminSchema = UserSchema.extend({
  role: z.literal("admin"),
});
