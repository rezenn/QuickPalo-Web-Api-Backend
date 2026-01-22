import z from "zod";
import { UserSchema } from "../types/user.type";

export const RegisterUserDto = UserSchema.pick({
  fullname: true,
  email: true,
  phoneNumber: true,
  password: true,
  confirmPassword: true,
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  })
  .transform(({ confirmPassword, ...rest }) => rest);

export type RegisterUserDto = z.infer<typeof RegisterUserDto>;

export const LoginUserDto = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;

// export const UpdateUserDto = UserSchema.pick({
//   fullname: true,
//   email: true,
//   profileImage: true,
// }).partial();
// export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

export const CreateAdminSchema = UserSchema.extend({
  role: z.literal("admin"),
});
export type createAdminDto = z.infer<typeof CreateAdminSchema>;

export const UpdateUserDto = UserSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
