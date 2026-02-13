import { UserRepository } from "../../repositories/user.repository";
import {
  LoginUserDto,
  RegisterUserDto,
  UpdateUserDto,
} from "../../dtos/user.dto";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";
import { HttpError } from "../../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../configs";
import { sendEmail } from "../../configs/email";
import { OrganizationModel } from "../../models/organization.model";
import mongoose from "mongoose";

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

  async getOrganizationById(organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new HttpError(400, "Invalid organization ID");
    }

    const organization = await OrganizationModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullName: 1,
                email: 1,
                phoneNumber: 1,
                profilePicture: 1,
                role: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          organizationName: 1,
          organizationType: 1,
          description: 1,
          street: 1,
          city: 1,
          state: 1,
          contactEmail: 1,
          contactPhone: 1,
          workingHours: 1,
          departments: 1,
          appointmentDuration: 1,
          advanceBookingDays: 1,
          timeSlots: 1,
          isActive: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          user: 1,
        },
      },
    ]);

    if (!organization || organization.length === 0) {
      throw new HttpError(404, "Organization not found");
    }

    return organization[0];
  }

  async getAllOrganizations(filters: {
    city?: string;
    organizationType?: string;
    page: number;
    limit: number;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    const {
      city,
      organizationType,
      page,
      limit,
      isActive = true,
      isVerified,
    } = filters;

    const query: any = { isActive };

    if (city) query.city = { $regex: new RegExp(city, "i") };
    if (organizationType) query.organizationType = organizationType;
    if (isVerified !== undefined) query.isVerified = isVerified;

    const organizations = await OrganizationModel.aggregate([
      { $match: query },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullName: 1,
                email: 1,
                phoneNumber: 1,
                profilePicture: 1,
                role: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Project final structure
      {
        $project: {
          _id: 1,
          userId: 1,
          organizationName: 1,
          organizationType: 1,
          description: 1,
          street: 1,
          city: 1,
          state: 1,
          contactEmail: 1,
          contactPhone: 1,
          workingHours: 1,
          departments: 1,
          appointmentDuration: 1,
          advanceBookingDays: 1,
          timeSlots: 1,
          isActive: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: "$user._id",
            fullName: "$user.fullName",
            email: "$user.email",
            phoneNumber: "$user.phoneNumber",
            profilePicture: "$user.profilePicture",
          },
        },
      },

      { $sort: { createdAt: -1 } },

      // Pagination
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
          totalPages: [
            { $count: "count" },
            {
              $addFields: {
                totalPages: { $ceil: { $divide: ["$count", limit] } },
              },
            },
            { $project: { totalPages: 1 } },
          ],
        },
      },
    ]);

    return {
      data: organizations[0]?.data || [],
      pagination: {
        page,
        limit,
        total: organizations[0]?.total[0]?.count || 0,
        totalPages: organizations[0]?.totalPages[0]?.totalPages || 0,
        hasNextPage: page < (organizations[0]?.totalPages[0]?.totalPages || 0),
        hasPrevPage: page > 1,
      },
    };
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

  async sendResetPasswordEmail(email?: string) {
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px; 
          font-weight: bold;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello ${user.fullName || "User"},</p>
        <p>You have requested to reset your password. Click the button below to proceed:</p>
        <p>
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p><code>${resetLink}</code></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <div class="footer">
          <p>Thank you,<br>The QuickPalo Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

    await sendEmail(user.email, "Password Reset - QuickPalo", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateUser(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError(400, "Invalid or expired token");
    }
  }
}
