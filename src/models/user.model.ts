import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const userMongoSchema: Schema = new Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "organization", "admin"],
      default: "user",
    },
    image: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export interface IUser extends UserType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", userMongoSchema);
