import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const userMongoSchema: Schema = new Schema(
  {
    fullname: { type: String, require: true },
    email: { type: String, require: true },
    phoneNumber: { type: String, require: true },
    password: { type: String, require: true },
    role: {
      type: String,
      enum: ["user", "organization", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

export interface IUser extends UserType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", userMongoSchema);
