import z from "zod";

export const UserSchema = z.object({
  fullname: z.string().min(2),
  email: z.email(),
  phoneNumber: z.string().min(7),
  role: z.enum(["user", "organization", "admin"]).default("user"),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export type UserType = z.infer<typeof UserSchema>;
