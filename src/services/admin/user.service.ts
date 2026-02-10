import { UserRepository } from "../../repositories/user.repository";
import { RegisterUserDto, UpdateUserDto } from "../../dtos/user.dto";
import bcryptjs from "bcryptjs";
import { HttpError } from "../../errors/http-error";
import { CreateOrganizationDto } from "../../dtos/organization.dto";
import { CreateNewUserDto } from "../../dtos/admin.dto";
import fs from "fs";
import path from "path";

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
    if (user.role === "admin") {
      throw new HttpError(403, "Cannot delete admin users");
    }
    const result = await userRepository.deleteUser(userId);
    if (!result) {
      throw new HttpError(500, "Failed to delete user");
    }
    return result;
  }

  async updateOneUser(
    userId: string,
    updateData: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    if (updateData.role) {
      delete updateData.role;
    }
    if (updateData.email) {
      delete updateData.email;
    }
    if (updateData.password) {
      delete updateData.password;
    }
    if (file) {
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
      updateData.profilePicture = file.filename;
    }

    if (updateData.email && user.email !== updateData.email) {
      const checkEmail = await userRepository.getUserByEmail(updateData.email);
      if (checkEmail) {
        throw new HttpError(409, "Email already in use");
      }
    }

    const updateUser = await userRepository.updateUser(userId, updateData);
    if (!updateUser) {
      throw new HttpError(500, "Failed to update user");
    }
    return updateUser;
  }

  async getAllUsers({
    page,
    size,
    search,
    role,
  }: {
    page: string;
    size: string;
    search?: string;
    role?: string;
  }) {
    const currentPage = page ? parseInt(page) : 1;
    const pageSize = size ? parseInt(size) : 10;
    const currentSearch = search || "";

    const { users, total } = await userRepository.findAll({
      page: currentPage,
      size: pageSize,
      search: currentSearch,
      role: role || "user",
    });
    const usersWithUrls = users.map((user) => {
      const userObj = user.toObject();
      delete userObj.password;

      if (userObj.profilePicture) {
        userObj.imageUrl = `${process.env.BASE_URL || "http://localhost:5050"}/uploads/profile/${userObj.profilePicture}`;
      }
      return userObj;
    });
    return {
      users: usersWithUrls,
      pagination: {
        page: currentPage,
        size: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
  async getAllOrganizations() {
    const organizations = await userRepository.getAllOrganizations();

    if (!organizations || organizations.length === 0) {
      return [];
    }

    return organizations;
  }

  async createOrganization(
    data: CreateOrganizationDto,
    file?: Express.Multer.File,
  ) {
    const existingUser = await userRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new HttpError(409, "Email already in use");
    }
    if (existingUser) {
      throw new HttpError(409, "Email already in use");
    }
    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const organizationData: any = {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: "organization",
      password: hashedPassword,
    };

    // Handle file upload if exists
    if (file) {
      organizationData.profilePicture = file.filename;
    }

    const organization = await userRepository.createUser(organizationData);

    return organization;
  }
  async createNewUser(data: CreateNewUserDto, file?: Express.Multer.File) {
    const existingUser = await userRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new HttpError(409, "Email already on use");
    }
    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const userData = await userRepository.createUser({
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: "user",
      password: hashedPassword,
    });
    if (file) {
      userData.profilePicture = file.filename;
    }
    const user = await userRepository.createUser(userData);

    return user;
  }
}
