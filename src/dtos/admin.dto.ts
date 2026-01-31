import z from "zod";
import { UserSchema } from "../types/user.type";

export const CreateNewUserDto = UserSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password do not match",
  path: ["confirmPassword"],
});

export type CreateNewUserDto = z.infer<typeof CreateNewUserDto>;

export const UpdateUserDto = UserSchema.pick({
  fullName: true,
  phoneNumber: true,
  profilePicture: true,
}).partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
