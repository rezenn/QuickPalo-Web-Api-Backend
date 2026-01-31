import { UserRepository } from "../repositories/user.repository";
import { LoginUserDto, RegisterUserDto, UpdateUserDto } from "../dtos/user.dto";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs";

let userRepository = new UserRepository();

export class UserService {
  async registerUser(userData: RegisterUserDto) {
    const checkEmail = await userRepository.getUserByEmail(userData.email);

    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }
    const hasedPassword = await bcryptjs.hash(userData.password, 10);

    const newUser = await userRepository.createUser({
      ...userData,
      password: hasedPassword,
      role: "user",
    });
    return newUser;
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

  async updateUser(
    userId: string,
    data: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new HttpError(404, "User not found");
    if (data.role) {
      delete data.role;
    }
    if (data.email) {
      delete data.email;
    }
    if (data.password) {
      delete data.password;
    }
    if (file) {
      // delete old image if exists
      if (user.profilePicture) {
        const oldImagePath = path.resolve(
          process.cwd(),
          "uploads/profile",
          user.profilePicture,
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // store only filename
      data.profilePicture = file.filename;
    }

    if (data.email && user.email !== data.email) {
      const checkEmail = await userRepository.getUserByEmail(data.email);
      if (checkEmail) throw new HttpError(409, "Email already in use");
    }

    if (data.password) {
      data.password = await bcryptjs.hash(data.password, 10);
    }

    return await userRepository.updateUser(userId, data);
  }

  async getAllUsers() {
    const users = await userRepository.getNormalUsers();

    if (!users || users.length === 0) {
      return [];
    }

    return users;
  }
  async getAllOrganizations() {
    const organizations = await userRepository.getAllOrganizations();

    if (!organizations || organizations.length === 0) {
      return [];
    }

    return organizations;
  }
  async loginUser(loginData: LoginUserDto) {
    const user = await userRepository.getUserByEmail(loginData.email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const vaildPassword = await bcryptjs.compare(
      loginData.password,
      user.password,
    );

    if (!vaildPassword) {
      throw new HttpError(401, "Invaild credenrials");
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "30d",
    });
    return { token, user };
  }
  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }
}
