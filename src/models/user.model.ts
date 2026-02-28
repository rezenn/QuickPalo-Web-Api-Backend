import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const userMongoSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["user", "organization", "admin"],
      default: "user",
    },
    profilePicture: { type: String, required: false },
    googleId: { type: String, required: false, sparse: true },
    isGoogleUser: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export interface IUser extends UserType, Document {
  _id: mongoose.Types.ObjectId;
  googleId?: string;
  isGoogleUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", userMongoSchema);
