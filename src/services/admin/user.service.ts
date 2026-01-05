import { UserRepository } from "../../repositories/user.repository";
import { RegisterUserDto, UpdateUserDto } from "../../dtos/user.dto";
import bcryptjs from "bcryptjs";
import { HttpError } from "../../errors/http-error";
import { CreateOrganizationDto } from "../../dtos/organization.dto";

let userRepository = new UserRepository();

export class AdminUserService {
  async registerUser(userData: RegisterUserDto) {
    const checkEmail = await userRepository.getUserByEmail(userData.email);

    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }
    const hashedPassword = await bcryptjs.hash(userData.password, 10);
    const newAdmin = await userRepository.createUser({
      ...userData,
      password: hashedPassword,
      role: "admin",
    });
    return newAdmin;
  }
  async getOneUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async deleteOneUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const result = await userRepository.deleteUser(userId);
    if (!result) {
      throw new HttpError(500, "Failed to delete user");
    }
    return result;
  }

  async updateOneUser(userId: string, updateData: UpdateUserDto) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const updateUser = await userRepository.updateUser(userId, updateData);
    if (!updateUser) {
      throw new HttpError(500, "Failed to update user");
    }
    return updateUser;
  }
  async getAllUsers() {
    const users = await userRepository.getAllUsers();

    if (!users || users.length === 0) {
      return [];
    }

    return users;
  }

  async createOrganization(data: CreateOrganizationDto) {
    const existingUser = await userRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new HttpError(409, "Email already in use");
    }
    const hasedPassword = await bcryptjs.hash(data.password, 10);

    const organization = await userRepository.createUser({
      fullname: data.fullname,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: "organization",
      password: hasedPassword,
    });
    return organization;
  }
}
