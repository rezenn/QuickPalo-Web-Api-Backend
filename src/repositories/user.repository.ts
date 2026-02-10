import { QueryFilter } from "mongoose";
import { UserModel, IUser } from "../models/user.model";

export interface IUserRepository {
  createUser(userData: Partial<IUser>): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserById(userId: string): Promise<IUser | null>;
  getAllUsers(): Promise<IUser[]>;
  updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(userId: string): Promise<boolean | null>;
  findAll({
    page,
    size,
    search,
    role,
  }: {
    page: number;
    size: number;
    search?: string;
    role?: string;
  }): Promise<{ users: IUser[]; total: number }>;
}
export class UserRepository implements IUserRepository {
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(userData);
    await user.save();
    return user;
  }
  async getUserByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email: email }).select("+password");
    return user;
  }
  async getAllUsers(): Promise<IUser[]> {
    const users = await UserModel.find();
    return users;
  }
  async getAllOrganizations(): Promise<IUser[]> {
    const users = await UserModel.find({ role: "organization" });
    return users;
  }

  async getNormalUsers(): Promise<IUser[]> {
    const users = await UserModel.find({ role: "user" });
    return users;
  }
  async updateUser(
    userId: string,
    updateData: Partial<IUser>,
  ): Promise<IUser | null> {
    const updateUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    return updateUser;
  }
  async deleteUser(userId: string): Promise<boolean | null> {
    const result = await UserModel.findByIdAndDelete(userId);
    return result ? true : false;
  }
  async getUserById(userId: string): Promise<IUser | null> {
    const user = await UserModel.findById(userId);
    return user;
  }
  async findAll({
    page,
    size,
    search,
    role,
  }: {
    page: number;
    size: number;
    search?: string;
    role?: string;
  }): Promise<{ users: IUser[]; total: number }> {
    let filter: QueryFilter<IUser> = {};
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter = {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ],
      };
    }
    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .skip((page - 1) * size)
        .limit(size)
        .sort({ createdAt: -1 }),
      UserModel.countDocuments(filter),
    ]);
    return { users, total };
  }
}
